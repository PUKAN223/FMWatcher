"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowDownLeft,
  Clock,
  Receipt,
  Search,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import type { StoredTransaction } from "@/lib/storage/store";

export function TransactionPanel() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [search, setSearch] = useState("");
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
    setIsLoading(true);
    try {
      await fetch("/api/watcher/transactions", { method: "DELETE" });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = transactions.filter(
    (t) =>
      (t.senderName && t.senderName.toLowerCase().includes(search.toLowerCase())) ||
      (t.ref1 && t.ref1.toLowerCase().includes(search.toLowerCase())) ||
      (t.id_pay && t.id_pay.toLowerCase().includes(search.toLowerCase())) ||
      (t.amount && t.amount.toString().includes(search))
  );

  return (
    <Card className="border border-border/50 shadow-none bg-card h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Receipt className="h-4 w-4 text-emerald-500" />
              รายการรับเงินล่าสุด
            </CardTitle>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-normal border-border/60 text-muted-foreground px-2 py-0.5">
                {transactions.length} รายการ
              </Badge>
              {transactions.length > 0 && (
                <Button size="sm" variant="ghost" onClick={handleClear} disabled={isLoading} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2">
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
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="border-t border-border/40 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">เวลา / ID</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">ผู้โอน</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground h-8">เลขบัญชี (ref1)</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground text-right h-8">จำนวนเงิน</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground text-center h-8">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ArrowDownLeft className="h-6 w-6 text-muted-foreground/30 mb-1" />
                        <p className="text-xs font-medium">ยังไม่มีรายการรับเงิน</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tx) => (
                    <TableRow key={tx.id || tx.id_pay} className="border-border/30 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-2 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {tx.date_pay || new Date(tx.detectedAt).toLocaleTimeString("th-TH")}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">{tx.id_pay}</div>
                        </div>
                      </TableCell>

                      <TableCell className="py-2">
                        <div className="text-xs font-medium text-foreground">{tx.senderName || "ไม่ทราบชื่อ"}</div>
                        <div className="text-[10px] text-muted-foreground">{tx.provider}</div>
                      </TableCell>

                      <TableCell className="py-2 font-mono text-xs">
                        <span className="text-[11px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                          {tx.ref1 || "XX0000"}
                        </span>
                      </TableCell>

                      <TableCell className="py-2 text-right font-mono">
                        <div className="text-xs font-bold text-emerald-500">
                          +฿{parseFloat(tx.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </div>
                        {tx.balance && <div className="text-[10px] text-muted-foreground">เหลือ ฿{tx.balance}</div>}
                      </TableCell>

                      <TableCell className="py-2 text-center">
                        <span className="text-[10px] text-emerald-500 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {tx.webhook_status || "ok"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
