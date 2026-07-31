import { NextResponse } from "next/server";
import {
  readSettings,
  saveTransaction,
  appendLog,
  type StoredTransaction,
} from "@/lib/storage/store";

/**
 * POST /api/watcher/ingest
 *
 * Called by external scripts (e.g. scripts/test-krungthai.ts) when they
 * detect a real transfer from LINE. Saves the transaction to the shared
 * JSON store so the UI polls it, then fires the configured webhook URL.
 *
 * Body:
 *   {
 *     payload: WebhookPayload,   // id_pay, ref1, amount, amount_check, balance, date_pay, timestamp, webhook_status
 *     senderName?: string,
 *     provider?: string,
 *     rawMessage?: string,
 *   }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.payload) {
      return NextResponse.json(
        { success: false, error: "Missing payload field" },
        { status: 400 }
      );
    }

    const { payload, senderName, provider, rawMessage } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!payload.id_pay || !payload.amount) {
      return NextResponse.json(
        { success: false, error: "payload.id_pay and payload.amount are required" },
        { status: 400 }
      );
    }

    // ── Build StoredTransaction ───────────────────────────────────────────────
    const storedTx: StoredTransaction = {
      id: `evt_ext_${Date.now()}`,
      id_pay: payload.id_pay,
      ref1: payload.ref1 || "XX0000",
      amount: payload.amount,
      amount_check: payload.amount_check || String(Math.round(parseFloat(payload.amount) * 100)),
      balance: payload.balance || "",
      date_pay: payload.date_pay || new Date().toISOString().slice(0, 16).replace("T", " "),
      timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
      webhook_status: "ok",
      senderName: senderName || "Unknown",
      provider: provider || "Krungthai Connext",
      detectedAt: new Date().toISOString(),
      rawMessage: rawMessage,
    };

    // ── Save to transactions.json (idempotent — skips duplicate id_pay) ───────
    const all = saveTransaction(storedTx);
    const isDuplicate = !all.some((t) => t.id === storedTx.id);

    if (isDuplicate) {
      appendLog("info", `[INGEST] ข้ามรายการซ้ำ id_pay=${payload.id_pay}`, "INGEST");
      return NextResponse.json({
        success: true,
        message: "Duplicate transaction — skipped",
        duplicate: true,
      });
    }

    appendLog(
      "event",
      `[INGEST] บันทึกรายการเงินเข้า ฿${payload.amount} จาก ${senderName || "ผู้โอน"} (id_pay: ${payload.id_pay})`,
      "INGEST"
    );

    // ── Fire webhook if configured ─────────────────────────────────────────────
    const settings = readSettings();
    let webhookResult: { sent: boolean; status?: number; error?: string } = { sent: false };

    if (settings.webhookUrl) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const key = settings.webhookApiKey || process.env.WEBHOOK_API_KEY;
        if (key) headers["x-webhook-key"] = key;

        const res = await fetch(settings.webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          appendLog("success", `[INGEST] Webhook ส่งสำเร็จ (Status: ${res.status} OK) → ${settings.webhookUrl}`, "WEBHOOK");
          webhookResult = { sent: true, status: res.status };
        } else {
          appendLog("warn", `[INGEST] Webhook ตอบกลับ ${res.status} → ${settings.webhookUrl}`, "WEBHOOK");
          webhookResult = { sent: true, status: res.status };
        }
      } catch (err: any) {
        appendLog("warn", `[INGEST] Webhook ส่งล้มเหลว: ${err?.message}`, "WEBHOOK");
        webhookResult = { sent: false, error: err?.message };
      }
    } else {
      appendLog("warn", "[INGEST] ไม่ได้ตั้งค่า Webhook URL — ข้ามการส่ง", "WEBHOOK");
    }

    return NextResponse.json({
      success: true,
      message: `บันทึกรายการสำเร็จ ฿${payload.amount} จาก ${senderName || "ผู้โอน"}`,
      transaction: storedTx,
      webhook: webhookResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "POST /api/watcher/ingest to save a detected transaction and fire webhook.",
  });
}
