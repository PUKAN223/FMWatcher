# Desktop Migration Plan (Next.js → Tauri)

> Convert an existing Next.js application into a cross-platform desktop
> application using Tauri while preserving the existing project structure and
> server architecture.

---

# Objectives

- Keep existing Next.js project
- Keep SSR
- Keep API Routes
- Keep Server Actions
- Run locally without requiring users to install Node.js
- Package everything into a single installer
- Support Windows, macOS, and Linux

---

# Phase 1 — Analyze Existing Project

## Review

- [ ] Next.js version
- [ ] App Router / Pages Router
- [ ] API Routes
- [ ] Server Actions
- [ ] Authentication
- [ ] Database
- [ ] Environment Variables
- [ ] Build Process
- [ ] Dependencies

Deliverable

- Existing project documented
- No code changes

---

# Phase 2 — Add Tauri

Tasks

- [ ] Initialize Tauri
- [ ] Configure Rust
- [ ] Configure Window
- [ ] Configure Icons
- [ ] Configure App Metadata

Deliverable

Desktop window opens successfully.

---

# Phase 3 — Create Local Runtime

Goal

Start the existing Next.js server automatically.

Flow

Launch Desktop

↓

Start Node Runtime

↓

Start Next.js

↓

Health Check

↓

Open Window

Tasks

- [ ] Detect available port
- [ ] Spawn Next.js process
- [ ] Wait until server is ready
- [ ] Retry if startup fails
- [ ] Stop process on exit

---

# Phase 4 — Health Check

Create

```
GET /api/health
```

Response

```json
{
    "status": "ok"
}
```

Tasks

- [ ] Wait until HTTP 200
- [ ] Show splash screen while loading
- [ ] Timeout protection

---

# Phase 5 — Native Integration

Replace browser-only features with native APIs where appropriate.

Possible integrations

- [ ] File Picker
- [ ] Save Dialog
- [ ] Notifications
- [ ] Clipboard
- [ ] Window Controls
- [ ] Tray Icon
- [ ] Auto Launch

---

# Phase 6 — Process Management

Desktop App

├── Rust Process

└── Node Process

Responsibilities

Rust

- Launch server
- Monitor server
- Restart if necessary
- Kill process on exit

Node

- Run Next.js
- Serve UI
- Handle APIs

---

# Phase 7 — Production Packaging

Bundle

- [ ] Next.js standalone build
- [ ] Node runtime
- [ ] Environment files
- [ ] Static assets
- [ ] Tauri binary

Installer

```
Setup.exe

↓

Install

↓

Launch

↓

Ready
```

---

# Phase 8 — Auto Update

Tasks

- [ ] Configure updater
- [ ] Version checking
- [ ] Download updates
- [ ] Restart application

---

# Phase 9 — Logging

Frontend

- Browser logs

Backend

- Next.js logs

Desktop

- Rust logs

Store logs

```
logs/

frontend.log

backend.log

desktop.log
```

---

# Phase 10 — Testing

Test

- [ ] Fresh install
- [ ] First launch
- [ ] Update flow
- [ ] Restart
- [ ] Offline mode
- [ ] Database connection
- [ ] Graceful shutdown

---

# Build Pipeline

Development

```
pnpm dev

↓

Next.js Dev Server

↓

Tauri Dev
```

Production

```
pnpm build

↓

next build

↓

next build --standalone

↓

Bundle Node Runtime

↓

tauri build

↓

Installer
```

---

# Startup Sequence

```
User launches app

↓

Load configuration

↓

Start bundled Node.js

↓

Start Next.js server

↓

Wait for /api/health

↓

Open desktop window

↓

Application ready
```

---

# Shutdown Sequence

```
User exits

↓

Save state

↓

Stop Next.js

↓

Stop Node.js

↓

Exit desktop app
```

---

# Checklist

## Tauri

- [ ] Window
- [ ] Icons
- [ ] Splash Screen
- [ ] Updater
- [ ] Tray

## Next.js

- [ ] Health API
- [ ] Environment Variables
- [ ] Production Build
- [ ] Standalone Mode

## Runtime

- [ ] Embedded Node.js
- [ ] Server Supervisor
- [ ] Process Cleanup

## Release

- [ ] Windows
- [ ] macOS
- [ ] Linux
