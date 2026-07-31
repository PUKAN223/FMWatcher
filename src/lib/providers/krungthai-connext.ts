/**
 * Krungthai Connext Provider Adapter
 *
 * Matches LINE messages & Flex Messages from the "Krungthai CONNEXT" official account
 * and parses money-received notification messages into TransferEvents.
 *
 * Typical notification formats (Thai):
 *   Format Flex Message (ALT_TEXT / FLEX_JSON):
 *     "เงินเข้า: 1.00 บาท เข้าบัญชี XX2481 เมื่อ 31/07/69 11:42 ยอดเงินที่ใช้ได้ 21.11 บาท"
 *     "ผู้โอน: นาย กันตพงศ์ ชำนาญกิจ"
 *
 *   Format A (PromptPay incoming):
 *     รับเงิน ฿1,250.00
 *     จาก นาย สมชาย ใจดี
 *     วันที่ 31 ก.ค. 2569 เวลา 10:24 น.
 */

import type { ProviderAdapter, TransferEvent } from "./types";
import { generateEventId } from "./types";

// Sender names that LINE uses for Krungthai Connext notifications
const SENDER_PATTERNS = [
  /krungthai/i,
  /กรุงไทย/i,
  /ktb/i,
  /เป๋าตัง/i,
  /promptpay/i,
];

// Amount extraction: handles "+1.00", "เงินเข้า: 1.00 บาท", "฿1,250.00", "500.00 บาท"
const AMOUNT_PATTERNS = [
  /เงินเข้า\s*[:：]?\s*[\+฿\$]?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /[\+฿\$]\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*บาท/i,
];

// Sender name extraction (person who sent money)
const FROM_PATTERNS = [
  /ผู้โอน\s*[:：]?\s*([^\n\r,]+)/i,
  /(?:จาก|from)\s*(?!บัญชี)\s*[:：]?\s*([^\n\r,]+)/i,
  /จากบัญชี\s*[:：]?\s*([^\n\r,]+)/i,
];

// Account number extraction (ref1)
const REF1_PATTERNS = [
  /(?:เข้าบัญชี|เข้าบัญชีเลขที่|เลขที่บัญชี)\s*[:：]?\s*([X\d-]+)/i,
  /บัญชี\s*[:：]?\s*([X\d-]+)/i,
];

// Balance extraction
const BALANCE_PATTERNS = [
  /(?:ยอดเงินที่ใช้ได้|ยอดเงินคงเหลือ|ยอดคงเหลือ|balance)\s*[:：]?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

// Time extraction: handles "31/07/69 11:42" or "เวลา 10:24"
const DATE_TIME_RE = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?)/;
const TIME_RE = /เวลา\s*[:：]?\s*(\d{1,2}:\d{2}(?::\d{2})?)/i;

// Regex tokens that indicate this is a RECEIVE (not send) message
const RECEIVE_KEYWORDS = /(?:เงินเข้า|รับเงิน|ได้รับโอนเงิน|รับเงินสำเร็จ|received|incoming|\+[\d\.]+)/i;

function parseFlexDate(text: string): string {
  const now = new Date();

  // Pattern: 31/07/69 11:42
  const dtMatch = text.match(DATE_TIME_RE);
  if (dtMatch) {
    const day = parseInt(dtMatch[1], 10);
    const month = parseInt(dtMatch[2], 10);
    let year = parseInt(dtMatch[3], 10);

    // If 2-digit Buddhist year e.g. 69 -> 2569 -> 2026
    if (year < 100) year = year + 2500 - 543;
    else if (year > 2500) year = year - 543;

    const [h, m] = dtMatch[4].split(":").map(Number);
    return new Date(year, month - 1, day, h, m).toISOString();
  }

  return now.toISOString();
}

export const KrungthaiConnextAdapter: ProviderAdapter = {
  id: "krungthai_connext",
  name: "Krungthai Connext",

  matches(senderName: string): boolean {
    if (!senderName) return false;
    return SENDER_PATTERNS.some((re) => re.test(senderName));
  },

  parse(messageText: string, rawSenderName: string): TransferEvent | null {
    if (!messageText) return null;

    // Must be a receive-money notification
    if (!RECEIVE_KEYWORDS.test(messageText)) return null;

    // Extract amount
    let amount: number | null = null;
    for (const pattern of AMOUNT_PATTERNS) {
      const match = messageText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }

    if (amount === null) return null;

    // Extract sender name (the person who transferred money)
    let senderName: string | undefined;
    for (const pattern of FROM_PATTERNS) {
      const match = messageText.match(pattern);
      if (match) {
        const candidate = match[1].trim();
        if (candidate && candidate !== "บัญชี") {
          senderName = candidate;
          break;
        }
      }
    }

    // Extract account number (ref1)
    let ref1 = "XX0000";
    for (const pattern of REF1_PATTERNS) {
      const match = messageText.match(pattern);
      if (match) {
        ref1 = match[1].trim();
        break;
      }
    }

    // Extract available balance
    let balance = "";
    for (const pattern of BALANCE_PATTERNS) {
      const match = messageText.match(pattern);
      if (match) {
        balance = match[1].replace(/,/g, "").trim();
        break;
      }
    }

    const transferredAt = parseFlexDate(messageText);
    const tsSec = Math.floor(new Date(transferredAt).getTime() / 1000);
    const idPay = `LINE-${tsSec}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      id: generateEventId(),
      idPay,
      provider: "krungthai_connext",
      ref1,
      amount,
      balance,
      currency: "THB",
      senderName,
      note: `via ${rawSenderName}`,
      transferredAt,
      detectedAt: new Date().toISOString(),
      rawMessage: messageText,
    };
  },
};
