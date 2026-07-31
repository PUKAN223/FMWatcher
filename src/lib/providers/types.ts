/**
 * Provider Adapter System
 *
 * Each provider (bank) knows:
 *  1. How to identify itself from an incoming chat sender name
 *  2. How to parse the notification message text into a structured TransferEvent
 */

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface TransferEvent {
  /** Unique ID for this event (generated on parse) */
  id: string;
  /** Unique ID for Webhook payload e.g. "LINE-1781212604-141" */
  idPay?: string;
  /** Provider that produced this event */
  provider: string;
  /** Account number / ref1 extracted from LINE notification e.g. "XX2481" */
  ref1?: string;
  /** Received amount (positive number e.g. 30.36) */
  amount: number;
  /** Available balance e.g. "1234.56" */
  balance?: string;
  /** ISO 4217 currency code, default "THB" */
  currency: string;
  /** Name of the person who sent the money, if extractable */
  senderName?: string;
  /** Extra note / remark from the message */
  note?: string;
  /** ISO 8601 timestamp of when the transfer occurred */
  transferredAt: string;
  /** ISO 8601 timestamp of when FM Watcher detected this event */
  detectedAt: string;
  /** The raw LINE message text for debugging */
  rawMessage: string;
}

// ─── Webhook Specification Payload ───────────────────────────────────────────

export interface WebhookPayload {
  /** ID ไม่ซ้ำต่อรายการ — ใช้กันส่งซ้ำ e.g. "LINE-1781212604-141" */
  id_pay: string;
  /** เลขบัญชีจากแจ้งเตือน LINE — KBank: xxx-x-x... Krungthai: XX#### SCB: X-#### Krungsri: XXX-X-XXXXX-X */
  ref1: string;
  /** ยอดบาท string e.g. "30.36" */
  amount: string;
  /** ยอดเป็นสตางค์ string e.g. "3036" */
  amount_check: string;
  /** ยอดเงินคงเหลือ / ยอดที่ใช้ได้ e.g. "1234.56" */
  balance: string;
  /** วันเวลาทำรายการ "YYYY-MM-DD HH:mm" e.g. "2026-06-12 14:30" */
  date_pay: string;
  /** Unix timestamp (seconds) e.g. 1781212604 */
  timestamp: number;
  /** สถานะการส่ง webhook e.g. "ok" */
  webhook_status: "ok";
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface ProviderAdapter {
  /** Unique machine identifier, e.g. "krungthai_connext" */
  readonly id: string;

  /** Human-readable name, e.g. "Krungthai Connext" */
  readonly name: string;

  /**
   * Return true when this adapter should handle the message.
   * Called with the display-name / chat-name of the LINE sender.
   */
  matches(senderName: string): boolean;

  /**
   * Parse the raw message text into a TransferEvent.
   * Return null if the message is not a transfer notification.
   */
  parse(messageText: string, rawSenderName: string): TransferEvent | null;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function generateEventId(): string {
  return "evt_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
}

export function toWebhookPayload(event: TransferEvent): WebhookPayload {
  const amountNum = event.amount || 0;
  const satang = Math.round(amountNum * 100).toString();
  const dateObj = event.transferredAt ? new Date(event.transferredAt) : new Date();

  // Format date_pay: "YYYY-MM-DD HH:mm"
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  const datePayStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  const tsSec = Math.floor(dateObj.getTime() / 1000);

  return {
    id_pay: event.idPay || `LINE-${tsSec}-${Math.floor(100 + Math.random() * 900)}`,
    ref1: event.ref1 || "XX0000",
    amount: amountNum.toFixed(2),
    amount_check: satang,
    balance: event.balance || "",
    date_pay: datePayStr,
    timestamp: tsSec,
    webhook_status: "ok",
  };
}
