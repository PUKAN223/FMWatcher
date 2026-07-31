"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownLeft,
  Clock,
  QrCode,
  Receipt,
  Search,
  CheckCircle2,
  Trash2,
  Download,
  Code2,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import type { StoredTransaction } from "@/lib/storage/store";

export default function TransactionsPage() {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<StoredTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/watcher/transactions");
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 4000);

    const handleNewTx = () => {
      fetchTransactions();
    };

    window.addEventListener("fm-watcher-transaction", handleNewTx);
    return () => {
      clearInterval(interval);
      window.removeEventListener("fm-watcher-transaction", handleNewTx);
    };
  }, []);

  const handleClear = async () => {
    if (!confirm("คุณต้องการลบประวัติรายการรับเงินทั้งหมดใช่หรือไม่?")) return;
    setIsLoading(true);
    try {
      await fetch("/api/watcher/transactions", { method: "DELETE" });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["id_pay", "ref1", "amount", "amount_check", "balance", "date_pay", "senderName", "provider", "webhook_status"];
    const rows = transactions.map((t) => [
      t.id_pay,
      t.ref1,
      t.amount,
      t.amount_check,
      t.balance,
      t.date_pay,
      `"${t.senderName || ""}"`,
      `"${t.provider || ""}"`,
      t.webhook_status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fmwatcher_transactions_${Date.now()}.csv`;
    link.click();
  };

  const exportJSON = () => {
    if (transactions.length === 0) return;
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fmwatcher_transactions_${Date.now()}.json`;
    link.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <QrCode className="size-6 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">เชื่อมต่อ LINE ก่อน</h2>
            <p className="text-xs text-muted-foreground">
              กรุณาเข้าสู่ระบบด้วย LINE QR Code เพื่อดูประวัติรายการรับเงิน
            </p>
          </div>
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent("open-line-login"))}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none text-xs"
          >
            <QrCode className="size-4" />
            เข้าสู่ระบบด้วย LINE
          </Button>
        </div>
      </div>
    );
  }

  const filtered = transactions.filter(
    (t) =>
      (t.senderName && t.senderName.toLowerCase().includes(search.toLowerCase())) ||
      (t.ref1 && t.ref1.toLowerCase().includes(search.toLowerCase())) ||
      (t.id_pay && t.id_pay.toLowerCase().includes(search.toLowerCase())) ||
      (t.amount && t.amount.toString().includes(search))
  );

  const totalAmount = filtered.reduce((s, t) => s + parseFloat(t.amount || "0"), 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ประวัติการรับเงิน
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            รวม {transactions.length} รายการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={transactions.length === 0} className="gap-1.5 text-xs h-8 border-border/60">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
            <span>CSV</span>
          </Button>

          <Button size="sm" variant="outline" onClick={exportJSON} disabled={transactions.length === 0} className="gap-1.5 text-xs h-8 border-border/60">
            <Download className="h-3.5 w-3.5 text-blue-500" />
            <span>JSON</span>
          </Button>

          {transactions.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleClear} disabled={isLoading} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Minimal Summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-border/50 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              ยอดรับเงินรวม
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono text-emerald-500">
              ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              รายการทั้งหมด
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono text-foreground">
              {filtered.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/50 bg-card shadow-none">
        <CardHeader className="pb-3 px-4 pt-4 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold">
              ตารางประวัติรายการ
            </CardTitle>

            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 text-xs pl-8 bg-muted/20 border-border/50 shadow-none"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">ID รายการ (id_pay)</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">ผู้โอน</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">เลขบัญชี (ref1)</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground text-right h-8">จำนวนเงิน</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">วันเวลา</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground text-center h-8">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ArrowDownLeft className="h-6 w-6 text-muted-foreground/30 mb-1" />
                        <p className="text-xs font-medium">ไม่พบรายการ</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tx) => (
                    <TableRow
                      key={tx.id || tx.id_pay}
                      onClick={() => setSelectedTx(tx)}
                      className="border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <TableCell className="py-2.5 px-4 font-mono text-xs text-foreground">
                        {tx.id_pay}
                      </TableCell>

                      <TableCell className="py-2.5">
                        <div className="text-xs font-medium text-foreground">{tx.senderName || "ไม่ระบุชื่อ"}</div>
                        <div className="text-[10px] text-muted-foreground">{tx.provider}</div>
                      </TableCell>

                      <TableCell className="py-2.5 font-mono text-xs">
                        <span className="text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/40">
                          {tx.ref1 || "XX0000"}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right font-mono">
                        <div className="text-xs font-bold text-emerald-500">
                          +฿{parseFloat(tx.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </div>
                        {tx.balance && <div className="text-[10px] text-muted-foreground">เหลือ ฿{tx.balance}</div>}
                      </TableCell>

                      <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {tx.date_pay}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 text-center">
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground">
                          <Code2 className="h-3 w-3" />
                          <span>JSON</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* JSON Payload Detail Modal */}
      <Dialog open={Boolean(selectedTx)} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-500" />
              Webhook Payload
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              id_pay: {selectedTx?.id_pay}
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-zinc-950 text-zinc-300 font-mono text-xs rounded-md border border-border/40 overflow-x-auto">
                <pre>
                  {JSON.stringify(
                    {
                      id_pay: selectedTx.id_pay,
                      ref1: selectedTx.ref1,
                      amount: selectedTx.amount,
                      amount_check: selectedTx.amount_check,
                      balance: selectedTx.balance,
                      date_pay: selectedTx.date_pay,
                      timestamp: selectedTx.timestamp,
                      webhook_status: selectedTx.webhook_status,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 font-mono">
                <p>ผู้โอน: {selectedTx.senderName || "N/A"}</p>
                <p>ธนาคาร: {selectedTx.provider}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
