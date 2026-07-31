# WalletWatcher Program with LINE Integration Guide

This document provides the technical specification, regex parser engines, and implementation programs for **WalletWatcher**—an automated payment listener and dispatcher integrated with LINE notifications and designed specifically for consumption by [WebhooksRoutes](file:///c:/Users/KisuX3/Documents/Workspace/Project/Fastory-Rework/backend/src/api/webhooks/routes.ts).

---

## 1. System Architecture & Flow

WalletWatcher acts as a real-time notification bridge between payment providers (TrueMoney Wallet, Thai Commercial Banks via LINE Official Accounts) and the **Fastory-Rework** backend system.

```
+-------------------------------------------------------+
|  Payment Sources (Customer Pays via PromptPay / TM)  |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  LINE Official Account (KBANK Live, SCB, KTB, etc.)   |
|         OR Smartphone LINE App Notifications          |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                 WalletWatcher Daemon                  |
|  - Message Regex Parser (Extracts: id_pay, amount)    |
|  - Authentication Header Injector (x-webhook-key)     |
|  - Idempotency & Retry Handler                        |
+-------------------------------------------------------+
                           |
                           v  HTTP POST (JSON)
+-------------------------------------------------------+
|               Fastory Backend API                     |
|           [WebhooksRoutes] Endpoints:                 |
|  1. POST /api/v1/webhooks/tmwallet                    |
|  2. POST /api/v1/webhooks/promptpay/:phone            |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|          Prisma DB Order Auto-Completion              |
|  - Matches Pending Order by promptpay_amount          |
|  - Verifies < 5m expiration window                   |
|  - Marks Order status = 'completed'                   |
+-------------------------------------------------------+
```

---

## 2. API Contracts ([WebhooksRoutes](file:///c:/Users/KisuX3/Documents/Workspace/Project/Fastory-Rework/backend/src/api/webhooks/routes.ts))

WalletWatcher sends HTTP POST requests matching one of the two endpoints implemented in `WebhooksRoutes`.

### 2.1 Endpoint 1: TrueMoney Wallet Webhook

- **URL Path**: `POST /api/v1/webhooks/tmwallet`
- **Headers**:
  - `Content-Type: application/json`
  - `x-webhook-key: <WEBHOOK_API_KEY>` (or `Authorization: Bearer <WEBHOOK_API_KEY>`)
- **JSON Payload Format**:
  ```json
  {
    "id_pay": "202607310955123456",
    "amount": "150.00",
    "webhook_status": "ok"
  }
  ```
- **Response Success**: `{ "ok": true, "orderNo": "ORD-20260731-001" }`
- **Response Duplicate**: `{ "ok": true, "duplicate": true }`

---

### 2.2 Endpoint 2: Dynamic Per-Phone PromptPay Webhook

- **URL Path**: `POST /api/v1/webhooks/promptpay/:phone` (e.g., `/api/v1/webhooks/promptpay/0812345678`)
- **Headers**:
  - `Content-Type: application/json`
  - `x-webhook-key: <WEBHOOK_API_KEY>` (or `Authorization: Bearer <WEBHOOK_API_KEY>`)
- **JSON Payload Format**:
  ```json
  {
    "id_pay": "TXN-88492019482",
    "amount": 150.00,
    "bank": "KBANK",
    "sender": "Somchai S."
  }
  ```
- **Response Success**: `{ "ok": true, "orderNo": "ORD-20260731-002", "storeId": "store_123" }`
- **Response Expired Order**: `{ "ok": false, "reason": "order_expired" }`

---

## 3. LINE Bank Notification Regex Parser Engine

Bank notifications received via LINE Official Accounts (or push notifications) contain varying message structures. WalletWatcher utilizes the following regex patterns to parse transaction amounts and IDs.

### Regex Patterns Table

| Bank / Provider | Sample LINE Message Text | Amount Regex Pattern | Transaction ID Regex Pattern |
| :--- | :--- | :--- | :--- |
| **KBank (KBANK Live)** | `เงินเข้า 150.00 บาท จาก นายสมชาย ช. เข้าบัญชี x-1234 รหัสอ้างอิง TXN123456` | `(?:เงินเข้า\|รับเงิน)\s*([\d,]+\.\d{2})` | `(?:รหัสอ้างอิง\|Ref)\s*([A-Za-z0-9]+)` |
| **SCB (SCB Connect)** | `รับโอนเงิน 150.00 บาท จาก PROMPTPAY รหัสรายการ: SCB987654321` | `(?:รับโอนเงิน\|เงินเข้า)\s*([\d,]+\.\d{2})` | `(?:รหัสรายการ\|เลขที่อ้างอิง)\s*([A-Za-z0-9]+)` |
| **KTB (Krungthai Connext)**| `เงินเข้าบัญชี x1234 จำนวน 150.00 บาท Ref: KTB0009988` | `(?:จำนวน\|รับเงิน)\s*([\d,]+\.\d{2})` | `(?:Ref\|รหัสอ้างอิง):\s*([A-Za-z0-9]+)` |
| **TTB (ttb bank)** | `เงินเข้า +150.00 บาท เข้าบัญชี 123-x-xxxxx-4 รหัส: TTB776655` | `\+([\d,]+\.\d{2})\s*บาท` | `(?:รหัส\|Ref):\s*([A-Za-z0-9]+)` |
| **TrueMoney Wallet** | `คุณได้รับเงินโอน 150.00 บาท เลขที่รายการ 500012345678` | `(?:ได้รับเงินโอน\|รับเงิน)\s*([\d,]+\.\d{2})` | `(?:เลขที่รายการ\|Transaction ID)\s*(\d+)` |

---

## 4. TypeScript / Node.js WalletWatcher Implementation

Below is a complete Node.js/TypeScript service that can run as a background daemon (via PM2, Docker, or Bun) to receive LINE Webhooks or push notifications, parse them, and dispatch webhooks to `WebhooksRoutes`.

```typescript
import express, { Request, Response } from "express";
import axios from "axios";

// Configuration
const PORT = process.env.WALLET_WATCHER_PORT || 9090;
const FASTORY_API_URL = process.env.FASTORY_API_URL || "http://localhost:8080";
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY || "your-secret-webhook-key";
const STORE_PROMPTPAY_PHONE = process.env.STORE_PROMPTPAY_PHONE || "0812345678";

const app = express();
app.use(express.json());

interface ParsedTransaction {
  idPay: string;
  amount: number;
  provider: string;
}

/**
 * Parses payment details from LINE notification body text
 */
function parseLineMessage(text: string): ParsedTransaction | null {
  if (!text) return null;

  // 1. Amount Extraction (supports commas e.g. 1,250.50)
  const amountMatch = text.match(/(?:เงินเข้า|รับโอนเงิน|ได้รับเงินโอน|จำนวน|\+)\s*([\d,]+\.\d{2})/i);
  if (!amountMatch) return null;

  const rawAmountStr = amountMatch[1].replace(/,/g, "");
  const amount = parseFloat(rawAmountStr);
  if (isNaN(amount) || amount <= 0) return null;

  // 2. Transaction ID / Ref Extraction
  const idMatch = text.match(/(?:รหัสอ้างอิง|รหัสรายการ|เลขที่รายการ|Ref|รหัส):\s*([A-Za-z0-9]+)/i) ||
                  text.match(/(?:TXN|SCB|KTB|TTB|5000)\d+/i);
  
  // Fallback: Generate timestamp-based ID if bank does not provide reference ID in LINE alert
  const idPay = idMatch ? idMatch[1] : `LINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 3. Provider detection
  let provider = "promptpay";
  if (text.includes("TrueMoney") || text.includes("ทรูมันนี่")) {
    provider = "tmwallet";
  }

  return { idPay, amount, provider };
}

/**
 * Dispatches webhook payload to Fastory WebhooksRoutes
 */
async function dispatchToFastory(parsed: ParsedTransaction): Promise<boolean> {
  try {
    const isTM = parsed.provider === "tmwallet";
    const endpoint = isTM 
      ? `${FASTORY_API_URL}/api/v1/webhooks/tmwallet`
      : `${FASTORY_API_URL}/api/v1/webhooks/promptpay/${STORE_PROMPTPAY_PHONE}`;

    const payload = isTM
      ? {
          id_pay: parsed.idPay,
          amount: parsed.amount.toString(),
          webhook_status: "ok"
        }
      : {
          id_pay: parsed.idPay,
          amount: parsed.amount,
          source: "LINE_WALLET_WATCHER"
        };

    console.log(`[WalletWatcher] Forwarding to ${endpoint}:`, payload);

    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-webhook-key": WEBHOOK_API_KEY
      },
      timeout: 5000
    });

    console.log(`[WalletWatcher] Response:`, response.data);
    return response.status === 200;
  } catch (error: any) {
    console.error(`[WalletWatcher] Dispatch Error:`, error.response?.data || error.message);
    return false;
  }
}

// Route to handle incoming LINE webhook or Android AutoNotification payload
app.post("/webhook/line", async (req: Request, res: Response) => {
  const { events, notificationText } = req.body;

  // Case A: Android AutoNotification / Direct POST payload
  if (notificationText) {
    const parsed = parseLineMessage(notificationText);
    if (parsed) {
      const success = await dispatchToFastory(parsed);
      return res.status(200).json({ ok: success, parsed });
    }
    return res.status(400).json({ error: "Could not parse notification text" });
  }

  // Case B: LINE Messaging API Webhook events
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text;
        const parsed = parseLineMessage(text);
        if (parsed) {
          await dispatchToFastory(parsed);
        }
      }
    }
    return res.status(200).send("OK");
  }

  return res.status(400).json({ error: "Invalid payload format" });
});

app.listen(PORT, () => {
  console.log(`🚀 WalletWatcher Daemon running on port ${PORT}`);
});
```

---

## 5. Mobile Android Listener Setup (MacroDroid / Tasker)

If running a dedicated POS smartphone receiving LINE Bank notifications:

### MacroDroid Setup Instructions
1. **Trigger**: Notification Received -> Select App: `LINE` (Filter by Content: `เงินเข้า` OR `รับโอนเงิน` OR `ได้รับเงินโอน`).
2. **Action**: HTTP Request:
   - **Method**: `POST`
   - **URL**: `http://<YOUR_SERVER_IP>:9090/webhook/line`
   - **Header**: `Content-Type: application/json`
   - **Body Text**:
     ```json
     {
       "notificationText": "[not_text]",
       "notificationTitle": "[not_title]"
     }
     ```

---

## 6. Verification & Test Commands

You can verify the integration directly against `WebhooksRoutes` using cURL commands:

### Test 1: Simulating TrueMoney Webhook
```bash
curl -X POST "http://localhost:8080/api/v1/webhooks/tmwallet" \
  -H "Content-Type: application/json" \
  -H "x-webhook-key: your-secret-webhook-key" \
  -d '{
    "id_pay": "TM-TEST-20260731-001",
    "amount": "150.00",
    "webhook_status": "ok"
  }'
```

### Test 2: Simulating PromptPay Phone Webhook
```bash
curl -X POST "http://localhost:8080/api/v1/webhooks/promptpay/0812345678" \
  -H "Content-Type: application/json" \
  -H "x-webhook-key: your-secret-webhook-key" \
  -d '{
    "id_pay": "PP-TEST-20260731-002",
    "amount": 150.00
  }'
```
