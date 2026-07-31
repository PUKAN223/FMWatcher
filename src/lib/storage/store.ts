import fs from "node:fs";
import path from "node:path";
import type { TransferEvent, WebhookPayload } from "../providers/types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface AppSettings {
  webhookUrl: string;
  webhookApiKey: string;
  autoStart: boolean;
  pollingIntervalMs: number;
  provider: string;
}

export interface SavedSession {
  sessionId: string;
  providerId: string;
  authToken: string;
  status: "authenticated" | "stopped" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface StoredTransaction {
  id: string;
  id_pay: string;
  ref1: string;
  amount: string;
  amount_check: string;
  balance: string;
  date_pay: string;
  timestamp: number;
  webhook_status: "ok" | "failed" | "pending";
  senderName?: string;
  provider: string;
  detectedAt: string;
  rawMessage?: string;
}

export interface ServerLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "event" | "success" | "warn" | "error";
  message: string;
  source: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  webhookUrl: "http://localhost:3000/api/webhook",
  webhookApiKey: "",
  autoStart: false,
  pollingIntervalMs: 500,
  provider: "krungthai_connext",
};

export function readSettings(): AppSettings {
  return readJson("settings.json", DEFAULT_SETTINGS);
}

export function writeSettings(settings: Partial<AppSettings>): AppSettings {
  const current = readSettings();
  const updated = { ...current, ...settings };
  writeJson("settings.json", updated);
  return updated;
}

export function readTransactions(): StoredTransaction[] {
  return readJson<StoredTransaction[]>("transactions.json", []);
}

export function saveTransaction(tx: StoredTransaction): StoredTransaction[] {
  const current = readTransactions();
  // Prevent duplicate id_pay
  if (current.some((t) => t.id_pay === tx.id_pay)) {
    return current;
  }
  const updated = [tx, ...current].slice(0, 500); // keep max 500 transactions
  writeJson("transactions.json", updated);
  return updated;
}

export function clearTransactions(): void {
  writeJson("transactions.json", []);
}

export function readSessions(): SavedSession[] {
  return readJson<SavedSession[]>("sessions.json", []);
}

export function writeSessions(sessions: SavedSession[]): void {
  writeJson("sessions.json", sessions);
}

export function readLogs(): ServerLogEntry[] {
  return readJson<ServerLogEntry[]>("logs.json", []);
}

export function appendLog(level: ServerLogEntry["level"], message: string, source: string = "SYSTEM"): ServerLogEntry {
  const current = readLogs();
  const entry: ServerLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString("th-TH"),
    level,
    message,
    source,
  };
  const updated = [...current, entry].slice(-200); // keep last 200 logs
  writeJson("logs.json", updated);
  return entry;
}

export function clearLogs(): void {
  writeJson("logs.json", []);
}

function readJson<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content || !content.trim()) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
      return defaultValue;
    }
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`[Store] Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[Store] Error writing ${filename}:`, err);
  }
}
