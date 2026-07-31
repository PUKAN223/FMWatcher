/**
 * FMWatcher — LINE Event Listener Daemon
 * ───────────────────────────────────────────────────────────────────────────
 * Connects to LINE via @evex/linejs, intercepts Krungthai Connext transfer
 * notifications in real-time, and pushes them into the FMWatcher Next.js
 * server via POST /api/watcher/ingest so the UI updates and the webhook fires.
 *
 * Usage:
 *   bun run test:krungthai [LINE_AUTH_TOKEN]
 *   LINE_AUTH_TOKEN=<token> bun run test:krungthai
 */

import pino from "pino";
import { BaseClient } from "@evex/linejs/base";
import { KrungthaiConnextAdapter } from "../src/lib/providers/krungthai-connext";
import { toWebhookPayload } from "../src/lib/providers/types";

// ─── Logger Setup ─────────────────────────────────────────────────────────────

const log = pino({
  level: "trace",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname",
      messageFormat: "{msg}",
      levelFirst: true,
      customColors:
        "trace:gray,debug:blue,info:cyan,warn:yellow,error:red,fatal:bgRed",
      customLevels: "",
      minimumLevel: "trace",
    },
  },
});

// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner() {
  const lines = [
    "",
    "  ╔══════════════════════════════════════════════════╗",
    "  ║      💸  FMWatcher — LINE Listener Daemon        ║",
    "  ║         Krungthai Connext · Real-time            ║",
    "  ╚══════════════════════════════════════════════════╝",
    "",
  ];
  for (const l of lines) process.stdout.write(l + "\n");
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SERVER_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3030";
const RECONNECT_DELAY_MS = 5_000;
const MAX_RETRIES = 10;

// ─── Auth Token Discovery ─────────────────────────────────────────────────────

/**
 * Priority:
 *  1. CLI arg:  bun run listener <TOKEN>
 *  2. Env var:  LINE_AUTH_TOKEN=<TOKEN>
 *  3. Server:   GET /api/watcher/control → settings → (no token there)
 *              GET /api/line/qr/status?sessionId=... from active in-memory sessions
 *              GET /api/watcher/sessions → sessions.json on disk (persisted after QR login)
 *  4. Wait:    Poll every 3s until the user logs in via the app UI
 */

async function fetchTokenFromServer(): Promise<string | null> {
  try {
    // Try /api/watcher/sessions (reads sessions.json)
    const res = await fetch(`${SERVER_URL}/api/watcher/sessions`);
    if (res.ok) {
      const data = await res.json();
      const sessions: Array<{ authToken?: string; status?: string }> =
        data.sessions || [];
      const active = sessions.find(
        (s) => s.status === "authenticated" && s.authToken
      );
      if (active?.authToken) return active.authToken;
    }
  } catch {
    /* server not ready yet */
  }
  return null;
}

async function resolveAuthToken(): Promise<string> {
  // 1. CLI arg
  const cliToken = process.argv[2]?.trim();
  if (cliToken) {
    log.info("Using auth token from CLI argument");
    return cliToken;
  }

  // 2. Env var
  const envToken = process.env.LINE_AUTH_TOKEN?.trim();
  if (envToken) {
    log.info("Using auth token from LINE_AUTH_TOKEN env var");
    return envToken;
  }

  // 3. Try fetching from server immediately
  log.info({ server: SERVER_URL }, "No token provided — checking server for saved session...");
  const serverToken = await fetchTokenFromServer();
  if (serverToken) {
    log.info("✅  Found saved auth token from server sessions");
    return serverToken;
  }

  // 4. Wait for user to login via the app UI
  log.warn(
    "No saved session found. Please log in via the FMWatcher app (QR code). Waiting..."
  );

  const POLL_INTERVAL = 3_000;
  const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const token = await fetchTokenFromServer();
    if (token) {
      log.info("✅  Auth token detected — user logged in via app UI!");
      return token;
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    log.debug(`Still waiting for login... (${elapsed}s elapsed)`);
  }

  log.fatal("Timed out waiting for user login (5 min). Exiting.");
  process.exit(1);
}

// ─── Flex / Rich Message Text Extractor ──────────────────────────────────────

function extractAllTextFromFlex(obj: any): string[] {
  if (!obj) return [];
  if (typeof obj === "string") return [obj];
  if (typeof obj !== "object") return [];

  const texts: string[] = [];
  if (Array.isArray(obj)) {
    for (const item of obj) texts.push(...extractAllTextFromFlex(item));
  } else {
    if (obj.layout === "horizontal" && Array.isArray(obj.contents)) {
      const sub: string[] = [];
      for (const child of obj.contents)
        sub.push(...extractAllTextFromFlex(child));
      texts.push(sub.length >= 2 ? sub.join(": ") : sub.join(""));
    } else {
      if (obj.text) texts.push(String(obj.text));
      if (obj.title) texts.push(String(obj.title));
      for (const key of ["contents", "body", "header", "footer"] as const)
        if (obj[key]) texts.push(...extractAllTextFromFlex(obj[key]));
    }
  }
  return texts;
}

function extractMessageText(
  message: any,
  decryptedText?: string
): { text: string; source: string } {
  if (decryptedText?.trim())
    return { text: decryptedText, source: "E2EE-decrypted" };

  if (message.text?.trim())
    return { text: message.text, source: "message.text" };

  const meta = message.contentMetadata || {};
  const altText = meta.ALT_TEXT || meta.altText;
  const flexJson = meta.FLEX_JSON || meta.flexJson;
  const directText = meta.TEXT || meta.text;

  const parts: string[] = [];
  if (altText) parts.push(String(altText));
  if (flexJson) {
    try {
      const obj =
        typeof flexJson === "string" ? JSON.parse(flexJson) : flexJson;
      parts.push(...extractAllTextFromFlex(obj));
    } catch {
      /* ignore */
    }
  }
  if (directText) parts.push(String(directText));

  const unique = [...new Set(parts)];
  return unique.length > 0
    ? { text: unique.join("\n"), source: "contentMetadata" }
    : { text: "", source: "none" };
}

// ─── Ingest → Next.js Server ─────────────────────────────────────────────────

async function ingestTransaction(
  webhookPayload: ReturnType<typeof toWebhookPayload>,
  senderName: string,
  rawMessage: string
): Promise<void> {
  try {
    const res = await fetch(`${SERVER_URL}/api/watcher/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: webhookPayload,
        senderName,
        provider: "Krungthai Connext",
        rawMessage,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      if (body.duplicate) {
        log.warn({ id_pay: webhookPayload.id_pay }, "Duplicate transaction — skipped by server");
      } else {
        log.info(
          {
            id_pay: webhookPayload.id_pay,
            amount: `฿${webhookPayload.amount}`,
            webhook: body.webhook,
          },
          "✅  Transaction saved & webhook dispatched"
        );
      }
    } else {
      log.warn(
        { status: res.status, url: `${SERVER_URL}/api/watcher/ingest` },
        "⚠️  Server ingest returned non-OK status — is the app running?"
      );
    }
  } catch (err: any) {
    log.warn(
      { error: err?.message, url: SERVER_URL },
      "⚠️  Could not reach FMWatcher server"
    );
  }
}

// ─── Main Polling Loop ────────────────────────────────────────────────────────

async function runListener(attempt: number, authToken: string): Promise<void> {
  const client = new BaseClient({ device: "DESKTOPWIN" });

  log.info({ attempt, server: SERVER_URL }, "Connecting to LINE...");

  try {
    await client.loginProcess.login({ authToken });
  } catch (err: any) {
    log.error({ error: err?.message }, "LINE login failed");
    throw err;
  }

  const profile = (client as any).profile;
  log.info(
    {
      displayName: profile?.displayName ?? "LINE User",
      mid: profile?.mid ?? "N/A",
    },
    "🟢  Logged in successfully"
  );
  log.info("Listening for Krungthai Connext messages... (Ctrl+C to exit)\n");

  const polling = client.createPolling();
  const stream = polling._listenTalkEvents({ pollingInterval: 500 });

  for await (const op of stream) {
    // ── Filter event types ─────────────────────────────────────────────────
    if (op.type !== "RECEIVE_MESSAGE" && op.type !== "SEND_MESSAGE") continue;

    const message = op.message;
    if (!message) continue;

    // ── Resolve sender display name ────────────────────────────────────────
    let senderDisplayName = "";
    const fromMid: string | undefined = message.from;
    if (fromMid) {
      try {
        const contact = await client.talk.getContact({ mid: fromMid });
        senderDisplayName = contact?.displayName ?? fromMid;
      } catch {
        senderDisplayName = fromMid;
      }
    }

    // ── Decrypt E2EE if available ──────────────────────────────────────────
    let decrypted: string | undefined;
    try {
      const result = await (client as any).e2ee?.decryptE2EEMessage?.(message);
      decrypted = result?.text;
    } catch {
      /* ignore */
    }

    // ── Extract text ───────────────────────────────────────────────────────
    const { text: extractedText, source: textSource } = extractMessageText(
      message,
      decrypted
    );

    // ── Filter: only Krungthai messages ───────────────────────────────────
    const isKrungthaiSender = KrungthaiConnextAdapter.matches(senderDisplayName);
    const isKrungthaiText =
      /krungthai|กรุงไทย|ktb|เป๋าตัง/i.test(extractedText);

    if (!isKrungthaiSender && !isKrungthaiText) continue;

    log.debug(
      {
        sender: senderDisplayName,
        contentType: message.contentType ?? 0,
        textSource,
        preview: extractedText.substring(0, 80),
      },
      "📨  Krungthai message received"
    );

    if (!extractedText) {
      log.debug({ sender: senderDisplayName }, "Message has no extractable text — skipped");
      continue;
    }

    // ── Try parsing as a transfer notification ─────────────────────────────
    const parsed = KrungthaiConnextAdapter.parse(extractedText, senderDisplayName);

    if (!parsed) {
      log.debug(
        { sender: senderDisplayName },
        "Not a transfer notification (no amount found)"
      );
      continue;
    }

    // ── Build webhook payload & log ────────────────────────────────────────
    const webhookPayload = toWebhookPayload(parsed);

    log.info(
      {
        amount: `฿${parsed.amount}`,
        from: parsed.senderName || senderDisplayName,
        ref1: webhookPayload.ref1,
        id_pay: webhookPayload.id_pay,
        balance: webhookPayload.balance || "-",
      },
      "💰  Transfer detected!"
    );

    // ── Push to server ─────────────────────────────────────────────────────
    await ingestTransaction(
      webhookPayload,
      parsed.senderName || senderDisplayName,
      extractedText
    );
  }
}

// ─── Retry Loop ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();
  log.info({ server: SERVER_URL }, "FMWatcher Listener starting up");

  // Resolve auth token once (auto-detect or wait for user login)
  const authToken = await resolveAuthToken();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await runListener(attempt, authToken);
      // If stream ends cleanly (server closed), retry
      log.warn("LINE polling stream ended — reconnecting...");
    } catch (err: any) {
      if (attempt >= MAX_RETRIES) {
        log.fatal({ error: err?.message }, `Max retries (${MAX_RETRIES}) reached. Shutting down.`);
        process.exit(1);
      }
      log.warn(
        { error: err?.message, retryIn: `${RECONNECT_DELAY_MS / 1000}s`, attempt },
        "Connection error — will retry"
      );
    }

    await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", () => {
  log.info("Received SIGINT — shutting down gracefully.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("Received SIGTERM — shutting down gracefully.");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  log.fatal({ error: err?.message, stack: err?.stack }, "Uncaught exception");
  process.exit(1);
});

main().catch((err) => {
  log.fatal({ error: err?.message }, "Failed to start");
  process.exit(1);
});
