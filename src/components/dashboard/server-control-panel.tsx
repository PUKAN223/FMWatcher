"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Trash2,
  Copy,
  CheckCircle2,
  Activity,
  Clock,
  Zap,
  Loader2,
  Send,
} from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error" | "event";
  message: string;
  source?: string;
}

export function ServerControlPanel() {
  const [status, setStatus] = useState<"running" | "stopped" | "fetching" | "error">("stopped");
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchLog, setSearchLog] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Webhook Test Dialog state
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testAmount, setTestAmount] = useState<string>("100.00");
  const [testSender, setTestSender] = useState<string>("นายสมชาย ใจดี (ทดสอบ)");

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/watcher/control");
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.logs && Array.isArray(data.logs)) setLogs(data.logs);
      if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach((tx: any) => {
          window.dispatchEvent(new CustomEvent("fm-watcher-transaction", { detail: tx }));
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "running") {
      interval = setInterval(() => {
        setUptimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setUptimeSeconds(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleStart = async () => {
    setIsLoading(true);
    setStatus("fetching");
    try {
      const res = await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.logs) setLogs(data.logs);
    } catch {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.logs) setLogs(data.logs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setStatus("fetching");
    try {
      const res = await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.logs) setLogs(data.logs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_webhook",
          amount: testAmount,
          senderName: testSender,
        }),
      });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
      if (data.transaction) {
        window.dispatchEvent(new CustomEvent("fm-watcher-transaction", { detail: data.transaction }));
      }
      setIsTestModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_logs" }),
      });
      setLogs([]);
    } catch {
      setLogs([]);
    }
  };

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source || "SYS"}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesSearch =
      searchLog === "" ||
      log.message.toLowerCase().includes(searchLog.toLowerCase()) ||
      (log.source && log.source.toLowerCase().includes(searchLog.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const getStatusBadge = () => {
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1.5 px-2.5 py-0.5 text-xs font-normal">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ONLINE
          </Badge>
        );
      case "fetching":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1.5 px-2.5 py-0.5 text-xs font-normal">
            <Loader2 className="h-3 w-3 animate-spin" />
            CONNECTING
          </Badge>
        );
      case "stopped":
        return (
          <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border/60 gap-1.5 px-2.5 py-0.5 text-xs font-normal">
            <span className="h-2 w-2 rounded-full bg-zinc-500"></span>
            OFFLINE
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5 px-2.5 py-0.5 text-xs font-normal">
            ERROR
          </Badge>
        );
    }
  };

  const getLevelBadgeClass = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "event":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "success":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "warn":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "error":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-zinc-400 bg-zinc-800/40 border-zinc-700/30";
    }
  };

  const renderHighlightedMessage = (message: string) => {
    const parts = message.split(/(฿[\d,\.]+|Status:\s*\d+(?:\s*\w+)?|https?:\/\/[^\s]+|LINE-[\w-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("฿")) {
        return <span key={idx} className="text-emerald-400 font-semibold">{part}</span>;
      }
      if (part.startsWith("Status:")) {
        const isOk = part.includes("200") || part.includes("OK");
        return (
          <span key={idx} className={`font-semibold px-1 rounded ${isOk ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
            {part}
          </span>
        );
      }
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return <span key={idx} className="text-sky-400 underline underline-offset-2 opacity-90">{part}</span>;
      }
      if (part.startsWith("LINE-")) {
        return <span key={idx} className="text-purple-300 font-mono">{part}</span>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Control Header Card */}
      <Card className="border border-border/50 bg-card shadow-none">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold">
                แผงควบคุมเซิร์ฟเวอร์
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {status === "running" && (
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatUptime(uptimeSeconds)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            {status === "stopped" || status === "error" ? (
              <Button
                size="sm"
                onClick={handleStart}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs font-medium px-3 shadow-none"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>เปิดเซิร์ฟเวอร์</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                disabled={isLoading}
                className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-1.5 h-8 text-xs font-medium px-3"
              >
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>หยุดทำงาน</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRestart}
              disabled={isLoading}
              className="gap-1.5 h-8 text-xs border-border/60"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>รีสตาร์ท</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsTestModalOpen(true)}
              disabled={isLoading}
              className="gap-1.5 h-8 text-xs border border-border/40"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>ทดสอบ Webhook</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Console Feed Panel */}
      <Card className="border border-border/50 bg-card shadow-none flex-1 flex flex-col min-h-[320px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/50 bg-muted/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Console Output ({filteredLogs.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="ค้นหา..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="h-6 w-28 text-[11px] bg-muted/20 border-border/50 shadow-none px-2"
            />

            <Button size="sm" variant="ghost" onClick={copyLogs} className="h-6 w-6 p-0 text-muted-foreground">
              {isCopied ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </Button>

            <Button size="sm" variant="ghost" onClick={handleClearLogs} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Console Log Stream */}
        <div className="flex-1 bg-zinc-950 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 text-zinc-300">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
              ไม่พบรายการ Log
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-500 shrink-0 text-[10px]">{log.timestamp}</span>

                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border uppercase shrink-0 ${getLevelBadgeClass(log.level)}`}>
                  {log.level}
                </span>

                {log.source && <span className="text-zinc-500 shrink-0">[{log.source}]</span>}

                <span className="text-zinc-200 break-all">{renderHighlightedMessage(log.message)}</span>
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      </Card>

      {/* Webhook Test Selection Dialog */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="max-w-sm border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              ทดสอบส่ง Webhook (เลือกจำนวนเงิน)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              กำหนดจำนวนเงินและชื่อผู้โอนที่ต้องการทดลองส่งไปยัง WEBHOOK_URL
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Amount Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ปุ่มเลือดยอดเงินด่วน:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {["1.00", "50.00", "100.00", "500.00", "1000.00"].map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={testAmount === preset ? "default" : "outline"}
                    onClick={() => setTestAmount(preset)}
                    className={`h-7 text-xs font-mono px-1 ${testAmount === preset ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-border/60"
                      }`}
                  >
                    ฿{parseFloat(preset)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">จำนวนเงิน (บาท):</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="h-8 text-xs font-mono bg-muted/20 border-border/60"
                placeholder="100.00"
              />
            </div>

            {/* Custom Sender Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ชื่อผู้โอน (ทดสอบ):</label>
              <Input
                value={testSender}
                onChange={(e) => setTestSender(e.target.value)}
                className="h-8 text-xs bg-muted/20 border-border/60"
                placeholder="นาย สมชาย ใจดี (ทดสอบ)"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsTestModalOpen(false)} className="h-8 text-xs">
                ยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={handleSimulate}
                disabled={isLoading || !testAmount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5 shadow-none"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>ส่ง Webhook (฿{parseFloat(testAmount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })})</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
