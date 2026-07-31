import { NextResponse } from "next/server";
import { BaseClient } from "@evex/linejs/base";
import { findAdapter } from "@/lib/providers";
import type { TransferEvent } from "@/lib/providers/types";
import { toWebhookPayload } from "@/lib/providers/types";
import { readSessions, writeSessions } from "@/lib/storage/store";

// ─── Global Session Store ─────────────────────────────────────────────────────

declare global {
  var linejsSessions: Map<string, LineSession>;
}

export interface LineSession {
  client: BaseClient;
  status: "init" | "qr" | "pincode" | "authenticated" | "error";
  qrUrl?: string;
  pincode?: string;
  user?: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  };
  authToken?: string;
  error?: string;
  /** Collected transfer events from polling */
  events: TransferEvent[];
  /** Active provider adapter ID (e.g. "krungthai_connext") */
  providerId: string;
  /** Webhook URL to forward events to */
  webhookUrl?: string;
  createdAt: number;
}

if (!globalThis.linejsSessions) {
  globalThis.linejsSessions = new Map();
}

// ─── Background Polling ───────────────────────────────────────────────────────

async function startProviderPolling(sessionId: string, client: BaseClient) {
  const session = globalThis.linejsSessions.get(sessionId);
  if (!session) return;

  console.log(`[FM Watcher] Starting event polling for session ${sessionId} (provider: ${session.providerId})`);

  try {
    const polling = client.createPolling();
    const talkStream = (polling as any)._listenTalkEvents
      ? (polling as any)._listenTalkEvents({ pollingInterval: 500 })
      : polling.listenTalkEvents();

    for await (const op of (talkStream as unknown as AsyncIterable<any>)) {
      // Re-fetch session each iteration in case it's been updated
      const s = globalThis.linejsSessions.get(sessionId);
      if (!s || s.status !== "authenticated") break;

      console.log(`[FM Watcher] Event received: type=${op.type}, from=${op.message?.from ?? "N/A"}`);

      // Only care about received messages for parsing
      if (op.type !== "RECEIVE_MESSAGE" && op.type !== "SEND_MESSAGE") continue;

      let messageText: string | undefined;
      let senderDisplayName = "";

      try {
        // Attempt E2EE decryption first
        const decrypted = await (client as any).e2ee?.decryptE2EEMessage?.(op.message);
        messageText = decrypted?.text ?? op.message?.text;
      } catch {
        // Fall back to plain text
        messageText = (op.message as any)?.text;
      }

      // Fallback for Rich / Flex / Template messages with contentMetadata (ALT_TEXT & FLEX_JSON)
      if (op.message?.contentMetadata) {
        const meta = op.message.contentMetadata;
        const altText = meta.ALT_TEXT || meta.altText;
        const flexJson = meta.FLEX_JSON || meta.flexJson;
        const directText = meta.TEXT || meta.text;

        const texts: string[] = [];
        if (messageText) texts.push(messageText);
        if (altText) texts.push(altText);
        if (directText) texts.push(directText);

        if (flexJson) {
          try {
            const rawFlex = typeof flexJson === "string" ? flexJson : JSON.stringify(flexJson);
            texts.push(rawFlex);
          } catch {
            // ignore
          }
        }

        if (texts.length > 0) {
          messageText = texts.join("\n");
        }
      }

      if (!messageText) continue;

      // Try to resolve sender display name from LINE contacts / chat info
      try {
        const fromMid = (op.message as any)?.from as string | undefined;
        if (fromMid) {
          const contact = await (client as any).talk?.getContact?.({ mid: fromMid });
          senderDisplayName = contact?.displayName ?? fromMid;
        }
      } catch {
        senderDisplayName = (op.message as any)?.from ?? "";
      }

      // Find the matching adapter
      const adapter = findAdapter(senderDisplayName);
      if (!adapter) {
        // Not from a known provider — skip silently
        continue;
      }

      // Only process if user selected this provider
      if (s.providerId && adapter.id !== s.providerId) {
        console.log(`[FM Watcher] Ignoring message from ${senderDisplayName} — adapter "${adapter.id}" not selected (active: "${s.providerId}")`);
        continue;
      }

      // Parse message into TransferEvent
      const event = adapter.parse(messageText, senderDisplayName);
      if (!event) {
        console.log(`[FM Watcher] Message from "${senderDisplayName}" matched adapter but was not a transfer notification`);
        continue;
      }

      console.log(`[FM Watcher] 💰 Transfer detected! ฿${event.amount} from ${event.senderName ?? "unknown"} via ${adapter.name}`);

      // Store event
      s.events.push(event);

      // Forward to Webhook if configured
      if (s.webhookUrl) {
        const payload = toWebhookPayload(event);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const apiKey = process.env.WEBHOOK_API_KEY;
        if (apiKey) {
          headers["x-webhook-key"] = apiKey;
        }

        try {
          const res = await fetch(s.webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
          const responseText = await res.text().catch(() => "");
          console.log(`[FM Watcher] Webhook POST dispatched to ${s.webhookUrl} | Status: ${res.status} | Response: "${responseText}"`);
        } catch (webhookErr) {
          console.error(`[FM Watcher] Webhook dispatch failed:`, webhookErr);
        }
      }
    }
  } catch (err) {
    console.error(`[FM Watcher] Polling error for session ${sessionId}:`, err);
    const s = globalThis.linejsSessions.get(sessionId);
    if (s) {
      s.status = "error";
      s.error = (err as Error)?.message ?? "Polling failed";
    }
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Accept optional config from request body
    let providerId = "krungthai_connext";
    let webhookUrl: string | undefined;

    try {
      const body = await request.json();
      if (body.providerId) providerId = body.providerId;
      if (body.webhookUrl) webhookUrl = body.webhookUrl;
    } catch {
      // no body — use defaults
    }

    const sessionId = "session_" + Math.random().toString(36).substring(2, 11);

    const client = new BaseClient({ device: "DESKTOPWIN" });

    const sessionData: LineSession = {
      client,
      status: "init",
      events: [],
      providerId,
      webhookUrl,
      createdAt: Date.now(),
    };

    globalThis.linejsSessions.set(sessionId, sessionData);

    // ── QR / PIN event listeners ──────────────────────────────────────────────

    client.on("qrcall", (url: string) => {
      console.log(`[LINEJS ${sessionId}] QR URL received`);
      const s = globalThis.linejsSessions.get(sessionId);
      if (s) { s.qrUrl = url; s.status = "qr"; }
    });

    client.on("pincall", (pin: string) => {
      console.log(`[LINEJS ${sessionId}] PIN: ${pin}`);
      const s = globalThis.linejsSessions.get(sessionId);
      if (s) { s.pincode = pin; s.status = "pincode"; }
    });

    client.on("update:authtoken", (token: string) => {
      console.log(`[LINEJS ${sessionId}] Auth token received`);
      const s = globalThis.linejsSessions.get(sessionId);
      if (s) {
        s.authToken = token;
        s.status = "authenticated";

        // ── Persist token to sessions.json so listener daemon can auto-read ──
        try {
          const existing = readSessions().filter((sess) => sess.sessionId !== sessionId);
          writeSessions([
            {
              sessionId,
              providerId: s.providerId,
              authToken: token,
              status: "authenticated",
              createdAt: new Date(s.createdAt).toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...existing,
          ]);
          console.log(`[LINEJS ${sessionId}] Auth token persisted to sessions.json`);
        } catch (err) {
          console.error(`[LINEJS ${sessionId}] Failed to persist auth token:`, err);
        }
      }
    });

    // ── Login + post-login setup ──────────────────────────────────────────────

    client.loginProcess.login({}).then(async () => {
      console.log(`[LINEJS ${sessionId}] Login complete`);

      const s = globalThis.linejsSessions.get(sessionId);
      if (!s) return;

      s.status = "authenticated";

      // Resolve user profile
      try {
        const prof = (client as any).profile;
        if (prof) {
          s.user = {
            userId: prof.mid ?? prof.userid ?? "LINE_" + sessionId,
            displayName: prof.displayName ?? "LINE User",
            pictureUrl: prof.picturePath
              ? `https://profile.line-scdn.net/${prof.picturePath}`
              : prof.pictureStatus
              ? `https://profile.line-scdn.net/${prof.pictureStatus}`
              : undefined,
            statusMessage: prof.statusMessage ?? "",
          };
        } else {
          s.user = { userId: "LINE_" + sessionId, displayName: "LINE User" };
        }
      } catch {
        s.user = { userId: "LINE_" + sessionId, displayName: "LINE User" };
      }

      // Start background polling — non-blocking
      startProviderPolling(sessionId, client).catch((err) => {
        console.error(`[FM Watcher] Unhandled polling error:`, err);
      });
    }).catch((err: unknown) => {
      console.error(`[LINEJS ${sessionId}] Login failed:`, err);
      const s = globalThis.linejsSessions.get(sessionId);
      if (s && s.status !== "authenticated") {
        s.status = "error";
        s.error = (err as Error)?.message ?? "Login failed";
      }
    });

    return NextResponse.json({ success: true, sessionId });
  } catch (error: unknown) {
    console.error("Error starting LINEJS QR Session:", error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
