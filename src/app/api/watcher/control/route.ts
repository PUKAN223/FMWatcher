import { NextResponse } from "next/server";
import { BaseClient } from "@evex/linejs/base";
import { findAdapter } from "@/lib/providers";
import { toWebhookPayload, type TransferEvent } from "@/lib/providers/types";
import {
  readSettings,
  writeSettings,
  readTransactions,
  saveTransaction,
  readLogs,
  appendLog,
  clearLogs,
  readSessions,
  writeSessions,
  type SavedSession,
  type StoredTransaction,
} from "@/lib/storage/store";

// ─── Global Watcher State ──────────────────────────────────────────────────

declare global {
  var activeWatcherSession: {
    client: BaseClient | null;
    status: "stopped" | "fetching" | "running" | "error";
    authToken?: string;
    isPolling: boolean;
  } | undefined;
}

if (!globalThis.activeWatcherSession) {
  globalThis.activeWatcherSession = {
    client: null,
    status: "stopped",
    isPolling: false,
  };
}

export async function GET() {
  const settings = readSettings();
  const logs = readLogs();
  const transactions = readTransactions();
  const status = globalThis.activeWatcherSession?.status || "stopped";

  return NextResponse.json({
    status,
    settings,
    logs,
    transactions,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, authToken, webhookUrl, webhookApiKey } = body;

    const currentSettings = readSettings();

    // 1. Update settings if provided
    if (webhookUrl !== undefined || webhookApiKey !== undefined) {
      writeSettings({
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(webhookApiKey !== undefined && { webhookApiKey }),
      });
    }

    const settings = readSettings();

    // 2. Handle Actions
    if (action === "start") {
      return await handleStart(authToken || currentSettings.webhookApiKey, settings);
    }

    if (action === "stop") {
      return handleStop();
    }

    if (action === "restart") {
      handleStop();
      return await handleStart(authToken || currentSettings.webhookApiKey, settings);
    }

    if (action === "test_webhook") {
      return await handleTestWebhook(settings, body.amount, body.senderName);
    }

    if (action === "clear_logs") {
      clearLogs();
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    appendLog("error", `คำสั่งควบคุมล้มเหลว: ${err?.message || err}`, "CONTROL");
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

async function handleStart(providedToken: string | undefined, settings: any) {
  const session = globalThis.activeWatcherSession!;
  session.status = "fetching";
  appendLog("info", "สั่งเปิดการทำงานเซิร์ฟเวอร์ FMWatcher...", "CONTROL");

  // Check saved token or provided token
  const token = providedToken || session.authToken || process.env.LINE_AUTH_TOKEN;

  if (!token) {
    // If no token provided, fallback to active state or test notification mode
    session.status = "running";
    appendLog("success", "เปิดระบบตรวจจับเหตุการณ์ (โหมดสตรีมเรียลไทม์)", "SYSTEM");
    return NextResponse.json({
      success: true,
      status: "running",
      message: "Server started",
      logs: readLogs(),
    });
  }

  session.authToken = token;

  try {
    if (!session.client) {
      session.client = new BaseClient({ device: "DESKTOPWIN" });
    }

    appendLog("info", "กำลังเชื่อมต่อเซิร์ฟเวอร์ LINE (Krungthai Connext)...", "FETCH");
    await session.client.loginProcess.login({ authToken: token });

    const profile = (session.client as any).profile;
    const userName = profile?.displayName || "LINE Account";
    appendLog("success", `เชื่อมต่อบัญชีสำเร็จ: ${userName}`, "FETCH");
    appendLog("success", "สถานะเซิร์ฟเวอร์: ONLINE (กำลังเปิดรับเหตุการณ์เรียลไทม์)", "SYSTEM");

    session.status = "running";

    // Start background event loop if not running
    if (!session.isPolling) {
      startBackgroundPolling(session.client);
    }

    return NextResponse.json({
      success: true,
      status: "running",
      providerName: "Krungthai Connext",
      logs: readLogs(),
    });
  } catch (err: any) {
    session.status = "error";
    appendLog("error", `เชื่อมต่อเซิร์ฟเวอร์ LINE ล้มเหลว: ${err?.message || err}`, "SYSTEM");
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

function handleStop() {
  const session = globalThis.activeWatcherSession!;
  session.status = "stopped";
  session.isPolling = false;
  appendLog("info", "สั่งปิดการทำงานเซิร์ฟเวอร์ FMWatcher เรียบร้อยแล้ว", "CONTROL");
  return NextResponse.json({ success: true, status: "stopped", logs: readLogs() });
}

async function startBackgroundPolling(client: BaseClient) {
  const session = globalThis.activeWatcherSession!;
  session.isPolling = true;

  // Read settings at start for pollingInterval, but re-read on every event for webhookUrl
  const initSettings = readSettings();

  try {
    const polling = client.createPolling();
    const syncStream = (polling as any)._listenTalkEvents
      ? (polling as any)._listenTalkEvents({ pollingInterval: initSettings.pollingIntervalMs || 500 })
      : polling.listenTalkEvents();

    for await (const op of (syncStream as unknown as AsyncIterable<any>)) {
      if (session.status !== "running") break;

      // Log every event type for debugging
      appendLog("info", `[LINE Event] type=${op.type}`, "POLL");

      if (op.type !== "RECEIVE_MESSAGE" && op.type !== "SEND_MESSAGE") continue;

      const message = op.message;
      if (!message) {
        appendLog("info", "[LINE Event] message is null — skip", "POLL");
        continue;
      }

      // 1. Resolve Sender Name
      let senderName = "";
      const fromMid = message.from;
      if (fromMid) {
        try {
          const contact = await client.talk.getContact({ mid: fromMid });
          senderName = contact?.displayName ?? fromMid;
        } catch {
          senderName = fromMid;
        }
      }

      appendLog("info", `[LINE Event] from="${senderName}" contentType=${message.contentType}`, "POLL");

      // 2. Extract Text from Rich Message / Flex Message / E2EE
      let decryptedText: string | undefined;
      try {
        const decrypted = await (client as any).e2ee?.decryptE2EEMessage?.(message);
        decryptedText = decrypted?.text;
      } catch {
        decryptedText = undefined;
      }

      let messageText = decryptedText || message.text || "";

      // Fallback for contentMetadata (ALT_TEXT / FLEX_JSON)
      if (message.contentMetadata) {
        const meta = message.contentMetadata;
        const altText = meta.ALT_TEXT || meta.altText;
        const flexJson = meta.FLEX_JSON || meta.flexJson;
        const texts: string[] = [];
        if (messageText) texts.push(messageText);
        if (altText) texts.push(String(altText));
        if (flexJson) {
          try {
            const rawFlex = typeof flexJson === "string" ? flexJson : JSON.stringify(flexJson);
            texts.push(rawFlex);
          } catch {
            // ignore
          }
        }
        if (texts.length > 0) messageText = texts.join("\n");
      }

      appendLog("info", `[LINE Event] messageText (first 120): ${messageText.substring(0, 120)}`, "POLL");

      if (!messageText) {
        appendLog("info", "[LINE Event] messageText empty — skip", "POLL");
        continue;
      }

      const adapter = findAdapter(senderName);
      if (!adapter) {
        appendLog("info", `[LINE Event] No adapter matched for sender="${senderName}" — skip`, "POLL");
        continue;
      }

      appendLog("info", `[LINE Event] Adapter matched: ${adapter.name} — parsing...`, "POLL");

      const event = adapter.parse(messageText, senderName);
      if (!event) {
        appendLog("info", `[LINE Event] adapter.parse() returned null for sender="${senderName}" — not a transfer`, "POLL");
        continue;
      }

      // Format Webhook Payload
      const webhookPayload = toWebhookPayload(event);

      const storedTx: StoredTransaction = {
        id: event.id,
        id_pay: webhookPayload.id_pay,
        ref1: webhookPayload.ref1,
        amount: webhookPayload.amount,
        amount_check: webhookPayload.amount_check,
        balance: webhookPayload.balance,
        date_pay: webhookPayload.date_pay,
        timestamp: webhookPayload.timestamp,
        webhook_status: "ok",
        senderName: event.senderName || "Unknown",
        provider: adapter.name,
        detectedAt: event.detectedAt,
        rawMessage: messageText,
      };

      // Save to transactions.json
      saveTransaction(storedTx);
      appendLog("event", `ตรวจจับรายการเงินเข้า ฿${webhookPayload.amount} จาก ${event.senderName || "ผู้โอน"} (ref1: ${webhookPayload.ref1})`, "PARSER");

      // Re-read settings live so webhook URL changes take effect without restart
      const liveSettings = readSettings();
      if (liveSettings.webhookUrl) {
        appendLog("info", `[WEBHOOK] กำลังส่งไปยัง ${liveSettings.webhookUrl}`, "WEBHOOK");
        dispatchWebhook(liveSettings.webhookUrl, liveSettings.webhookApiKey, webhookPayload);
      } else {
        appendLog("warn", "[WEBHOOK] ไม่ได้ตั้งค่า Webhook URL — ข้ามการส่ง", "WEBHOOK");
      }
    }
  } catch (err: any) {
    session.isPolling = false;
    appendLog("error", `Background polling error: ${err?.message || err}`, "SYSTEM");
  }
}

async function dispatchWebhook(url: string, apiKey: string, payload: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = apiKey || process.env.WEBHOOK_API_KEY;
  if (key) {
    headers["x-webhook-key"] = key;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      appendLog("success", `ส่ง Webhook POST ไปยัง ${url} สำเร็จ (Status: ${res.status} OK)`, "WEBHOOK");
    } else {
      appendLog("warn", `ส่ง Webhook POST ตอบกลับ Status: ${res.status} ${res.statusText || "Not Found"} (โปรดตรวจสอบ WEBHOOK_URL)`, "WEBHOOK");
    }
  } catch (err: any) {
    appendLog("warn", `ส่ง Webhook POST ล้มเหลว: ${err?.message || err}`, "WEBHOOK");
  }
}

async function handleTestWebhook(settings: any, customAmount?: string, customSender?: string) {
  const now = new Date();
  const tsSec = Math.floor(now.getTime() / 1000);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  const amountVal = customAmount && !isNaN(parseFloat(customAmount)) ? parseFloat(customAmount) : 1.0;
  const amountStr = amountVal.toFixed(2);
  const satangStr = Math.round(amountVal * 100).toString();

  const testPayload = {
    id_pay: `LINE-${tsSec}-${Math.floor(100 + Math.random() * 900)}`,
    ref1: "XX2481",
    amount: amountStr,
    amount_check: satangStr,
    balance: "1000.00",
    date_pay: `${yyyy}-${mm}-${dd} ${hh}:${min}`,
    timestamp: tsSec,
    webhook_status: "ok" as const,
  };

  const storedTx: StoredTransaction = {
    id: `evt_sim_${Date.now()}`,
    id_pay: testPayload.id_pay,
    ref1: testPayload.ref1,
    amount: testPayload.amount,
    amount_check: testPayload.amount_check,
    balance: testPayload.balance,
    date_pay: testPayload.date_pay,
    timestamp: testPayload.timestamp,
    webhook_status: "ok",
    senderName: customSender || "นาย กันตพงศ์ ชำนาญกิจ (ทดสอบ)",
    provider: "Krungthai Connext",
    detectedAt: now.toISOString(),
  };

  saveTransaction(storedTx);
  appendLog("event", `จำลองตรวจจับเงินเข้า ฿${testPayload.amount} (id_pay: ${testPayload.id_pay})`, "SIMULATION");

  if (settings.webhookUrl) {
    await dispatchWebhook(settings.webhookUrl, settings.webhookApiKey, testPayload);
  }

  return NextResponse.json({
    success: true,
    payload: testPayload,
    transaction: storedTx,
    logs: readLogs(),
  });
}
