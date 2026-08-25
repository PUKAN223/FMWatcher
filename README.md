# FMWatcher

> A real-time payment watcher that monitors Krungthai Connext notifications through LINE and converts incoming transfer messages into structured payment events and webhooks.

## <img src="https://api.iconify.design/lucide:radio.svg?color=%23ffffff" width="20" height="20" valign="middle"> Overview

FMWatcher is a payment monitoring system built to detect incoming bank transfers from **Krungthai Connext** through LINE notifications.

Instead of requiring a traditional bank API or manual slip verification, FMWatcher connects to a LINE account that receives Krungthai Connext transaction notifications and continuously listens for new messages.

When a transfer notification is detected, FMWatcher:

1. Receives the LINE event
2. Identifies Krungthai Connext messages
3. Extracts the notification content
4. Parses the transfer information
5. Converts it into a normalized payment payload
6. Sends the transaction to the application server
7. Stores the transaction
8. Dispatches a webhook

This makes FMWatcher suitable as a lightweight payment notification bridge for applications that need to react to incoming bank transfers in real time.

---

## <img src="https://api.iconify.design/lucide:workflow.svg?color=%23ffffff" width="20" height="20" valign="middle"> How It Works

```text
                   Krungthai Bank
                         |
                         v
                Krungthai Connext
                         |
                         v
                       LINE
                         |
                         v
                  @evex/linejs
                         |
                         v
                FMWatcher Listener
                         |
              +----------+----------+
              |                     |
              v                     v
        Message Filter        Text Extraction
                                    |
                                    v
                         Krungthai Parser
                                    |
                                    v
                           Payment Payload
                                    |
                                    v
                         /api/watcher/ingest
                           |
                    +------+------+
                    |             |
                    v             v
                Database       Webhook
```

The listener connects to LINE using `@evex/linejs` and listens for `RECEIVE_MESSAGE` and `SEND_MESSAGE` events.

---

## <img src="https://api.iconify.design/lucide:banknote.svg?color=%23ffffff" width="20" height="20" valign="middle"> Payment Detection

FMWatcher is specifically designed around **Krungthai Connext** payment notifications.

The listener identifies messages using both the sender and message content.

```text
Krungthai Sender
       OR
Message contains:
       |
       +-- krungthai
       +-- กรุงไทย
       +-- ktb
       +-- เป๋าตัง
       |
       v
Parse Transfer Notification
```

Messages that are unrelated to Krungthai are ignored.

The implementation checks both the sender identity and message text before attempting to parse the transaction.

---

## <img src="https://api.iconify.design/lucide:scan-text.svg?color=%23ffffff" width="20" height="20" valign="middle"> Message Extraction

Krungthai notifications may contain information in different message formats.

FMWatcher supports extracting text from:

* Normal LINE message text
* Content metadata
* Alternative text
* LINE Flex messages
* Flex JSON
* E2EE-decrypted messages

The listener attempts E2EE decryption when available before falling back to normal message extraction.

For Flex messages, nested `contents`, `body`, `header`, and `footer` structures are recursively processed to reconstruct readable transaction text.

---

## <img src="https://api.iconify.design/lucide:scan.svg?color=%23ffffff" width="20" height="20" valign="middle"> Transaction Parsing

After extracting the message text, FMWatcher passes it to the Krungthai Connext provider adapter.

```text
LINE Message
     |
     v
Text Extraction
     |
     v
KrungthaiConnextAdapter.parse()
     |
     v
Parsed Transaction
     |
     v
Webhook Payload
```

The parsed transaction can contain information such as:

* Amount
* Sender
* Reference information
* Payment ID
* Balance
* Original notification content

If the message does not contain a recognizable transfer notification, it is ignored.

---

## <img src="https://api.iconify.design/lucide:webhook.svg?color=%23ffffff" width="20" height="20" valign="middle"> Webhook Integration

Detected transactions are forwarded to:

```text
POST /api/watcher/ingest
```

The listener sends:

```json
{
  "payload": {},
  "senderName": "Krungthai Connext",
  "provider": "Krungthai Connext",
  "rawMessage": "..."
}
```

The server is responsible for processing the transaction after ingestion.

When the transaction is accepted, the server can:

* Store the transaction
* Detect duplicates
* Dispatch the configured webhook
* Return the webhook result to the listener

Duplicate transactions are explicitly detected and skipped by the server.

---

## <img src="https://api.iconify.design/lucide:repeat-2.svg?color=%23ffffff" width="20" height="20" valign="middle"> Connection Management

The LINE listener is designed to remain active and automatically reconnect when the connection fails.

```text
Connect
   |
   v
Listen
   |
   +---- Connection OK ----> Continue
   |
   +---- Connection Error
              |
              v
          Wait 5 seconds
              |
              v
           Retry
```

The listener currently allows up to 10 connection attempts with a 5-second delay between retries.

---

## <img src="https://api.iconify.design/lucide:key-round.svg?color=%23ffffff" width="20" height="20" valign="middle"> Authentication

FMWatcher supports multiple ways to provide the LINE authentication token.

Priority order:

```text
1. CLI argument
       |
       v
2. LINE_AUTH_TOKEN
       |
       v
3. Saved authenticated session
       |
       v
4. Wait for QR login through the application
```

The listener can retrieve an authenticated session from:

```text
/api/watcher/sessions
```

If no session is available, the listener waits for the user to authenticate through the FMWatcher application.

Example:

```bash
bun run listener YOUR_LINE_AUTH_TOKEN
```

Or:

```bash
LINE_AUTH_TOKEN=YOUR_LINE_AUTH_TOKEN bun run listener
```

---

## <img src="https://api.iconify.design/lucide:monitor.svg?color=%23ffffff" width="20" height="20" valign="middle"> Application

FMWatcher includes a web-based interface built with Next.js and can also be packaged as a desktop application using Tauri.

The repository contains:

```text
src/
src-tauri/
scripts/
```

with the LINE listener implemented separately in:

```text
scripts/server.ts
```

The repository currently exposes the listener as a dedicated process alongside the Next.js application.

---

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%23ffffff" width="20" height="20" valign="middle"> Tech Stack

### Application

| Technology    | Purpose            |
| ------------- | ------------------ |
| Next.js 16    | Web application    |
| React 19      | User interface     |
| TypeScript    | Type safety        |
| Tailwind CSS  | Styling            |
| shadcn        | UI components      |
| Radix UI      | UI primitives      |
| Framer Motion | Animations         |
| Lucide React  | Icons              |
| Recharts      | Data visualization |
| next-themes   | Theme management   |

### Payment Listener

| Technology                | Purpose          |
| ------------------------- | ---------------- |
| Bun                       | Runtime          |
| `@evex/linejs`            | LINE client      |
| Pino                      | Logging          |
| Krungthai Connext Adapter | Transfer parsing |

### Desktop

| Technology | Purpose                  |
| ---------- | ------------------------ |
| Tauri 2    | Desktop runtime          |
| Rust       | Native application layer |

These technologies and versions are reflected in the repository's current `package.json`.

---

## <img src="https://api.iconify.design/lucide:folder-tree.svg?color=%23ffffff" width="20" height="20" valign="middle"> Project Structure

```text
FMWatcher/
|
+-- src/
|   |
|   +-- app/
|   +-- components/
|   +-- context/
|   +-- hooks/
|   +-- lib/
|       |
|       +-- providers/
|           +-- krungthai-connext
|           +-- types
|
+-- scripts/
|   +-- server.ts
|
+-- src-tauri/
|   +-- capabilities/
|   +-- icons/
|   +-- src/
|   +-- Cargo.toml
|   +-- tauri.conf.json
|
+-- public/
|
+-- .github/
|   +-- workflows/
|
+-- package.json
+-- next.config.ts
+-- biome.json
+-- tsconfig.json
+-- components.json
```

The repository separates the frontend application, payment provider logic, listener process, and native desktop layer.

---

## <img src="https://api.iconify.design/lucide:rocket.svg?color=%23ffffff" width="20" height="20" valign="middle"> Getting Started

### Requirements

* Bun
* Node.js
* Rust
* Tauri system dependencies
* A LINE account receiving Krungthai Connext notifications

### Clone

```bash
git clone https://github.com/PUKAN223/FMWatcher.git
cd FMWatcher
```

### Install Dependencies

```bash
bun install
```

---

## <img src="https://api.iconify.design/lucide:terminal.svg?color=%23ffffff" width="20" height="20" valign="middle"> Development

Start both the Next.js application and payment listener:

```bash
bun run dev
```

The development script starts:

```text
Next.js
   |
   +-- Port 3030

LINE Listener
   |
   +-- scripts/server.ts
```

The repository's development script explicitly runs Next.js on port `3030` and starts the listener concurrently.

### Listener Only

```bash
bun run listener
```

---

## <img src="https://api.iconify.design/lucide:settings-2.svg?color=%23ffffff" width="20" height="20" valign="middle"> Configuration

The listener uses:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3030
LINE_AUTH_TOKEN=your_line_auth_token
```

`NEXT_PUBLIC_APP_URL` determines the application server used by the listener.

`LINE_AUTH_TOKEN` can be used to provide the LINE authentication token directly.

If no token is provided, FMWatcher attempts to discover an authenticated saved session and can wait for QR authentication through the application.

---

## <img src="https://api.iconify.design/lucide:activity.svg?color=%23ffffff" width="20" height="20" valign="middle"> Listener Lifecycle

```text
Start
 |
 v
Resolve LINE Auth Token
 |
 v
Login to LINE
 |
 v
Create LINE Event Polling
 |
 v
Receive Message
 |
 v
Resolve Sender
 |
 v
Decrypt E2EE
 |
 v
Extract Message Text
 |
 v
Check Krungthai
 |
 +---- No ----> Ignore
 |
 Yes
 |
 v
Parse Transfer
 |
 +---- Invalid ----> Ignore
 |
 Valid
 |
 v
Create Webhook Payload
 |
 v
POST /api/watcher/ingest
 |
 v
Save Transaction
 |
 v
Dispatch Webhook
```

The LINE event stream is polled with a 500 ms interval, while only receive/send message events are processed.

---

## <img src="https://api.iconify.design/lucide:shield-check.svg?color=%23ffffff" width="20" height="20" valign="middle"> Reliability

FMWatcher includes several mechanisms for reliable monitoring:

* Automatic LINE reconnection
* Duplicate transaction detection
* Multiple authentication sources
* E2EE message decryption when available
* Flexible message extraction
* Provider-specific transaction parsing
* Structured webhook payloads
* Graceful shutdown
* Structured Pino logging

The listener retries failed connections and shuts down gracefully on `SIGINT` and `SIGTERM`.

---

## <img src="https://api.iconify.design/lucide:code-2.svg?color=%23ffffff" width="20" height="20" valign="middle"> Scripts

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| `bun run dev`              | Start Next.js and the payment listener |
| `bun run build`            | Build the Next.js application          |
| `bun run start`            | Start the production Next.js server    |
| `bun run start:standalone` | Start standalone server and listener   |
| `bun run listener`         | Start the LINE payment listener        |
| `bun run lint`             | Run Biome checks                       |
| `bun run format`           | Format the codebase                    |
| `bun run tauri`            | Run Tauri CLI                          |

These scripts are defined in the repository's current `package.json`.

---

## <img src="https://api.iconify.design/lucide:plug-zap.svg?color=%23ffffff" width="20" height="20" valign="middle"> Integration Model

FMWatcher is designed to act as a bridge between bank notification infrastructure and an external application.

```text
                     Bank Transfer
                           |
                           v
                  Krungthai Connext
                           |
                           v
                          LINE
                           |
                           v
                     FMWatcher
                           |
                    Parse + Normalize
                           |
                           v
                  Payment Webhook
                           |
              +------------+------------+
              |                         |
              v                         v
        E-commerce / POS          Other Services
```

This allows an application to react to an incoming transfer without requiring the payment notification logic to live directly inside the main application.

---

## <img src="https://api.iconify.design/lucide:target.svg?color=%23ffffff" width="20" height="20" valign="middle"> Use Cases

FMWatcher can be used as a payment notification bridge for systems such as:

* POS systems
* Inventory platforms
* E-commerce applications
* Digital goods stores
* Subscription systems
* Order management systems
* Custom payment automation

A receiving application only needs to process the normalized webhook generated by FMWatcher.

---

## <img src="https://api.iconify.design/lucide:alert-triangle.svg?color=%23ffffff" width="20" height="20" valign="middle"> Important

FMWatcher depends on LINE account access and the format of Krungthai Connext notifications.

Changes to LINE, Krungthai Connext, authentication mechanisms, notification formats, or third-party client behavior may affect compatibility.

Authentication credentials and LINE session data should be treated as sensitive information and must never be committed to source control.

---

## <img src="https://api.iconify.design/lucide:github.svg?color=%23ffffff" width="20" height="20" valign="middle"> Repository

[PUKAN223/FMWatcher](https://github.com/PUKAN223/FMWatcher)

---

## <img src="https://api.iconify.design/lucide:scale.svg?color=%23ffffff" width="20" height="20" valign="middle"> License

License information has not been specified in the repository yet.
