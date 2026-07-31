"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Send,
  Building2,
  Smartphone,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface TransactionRecord {
  id: string;
  time: string;
  provider: "KBANK" | "SCB" | "KTB" | "TTB" | "TrueMoney";
  amount: number;
  refId: string;
  sender: string;
  webhookStatus: "success" | "duplicate" | "failed" | "pending";
  orderNo?: string;
  rawText: string;
}

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "TX-1001",
    time: "10:02:14",
    provider: "KBANK",
    amount: 150.0,
    refId: "TXN88492019482",
    sender: "Somchai S.",
    webhookStatus: "success",
    orderNo: "ORD-20260731-001",
    rawText: "เงินเข้า 150.00 บาท จาก นายสมชาย ช. เข้าบัญชี x-1234 รหัสอ้างอิง TXN88492019482",
  },
  {
    id: "TX-1002",
    time: "09:58:30",
    provider: "TrueMoney",
    amount: 320.0,
    refId: "TM500099281726",
    sender: "Anan K.",
    webhookStatus: "success",
    orderNo: "ORD-20260731-002",
    rawText: "คุณได้รับเงินโอน 320.00 บาท เลขที่รายการ 500099281726",
  },
  {
    id: "TX-1003",
    time: "09:45:12",
    provider: "SCB",
    amount: 1250.0,
    refId: "SCB991823712",
    sender: "PROMPTPAY",
    webhookStatus: "duplicate",
    orderNo: "ORD-20260731-003",
    rawText: "รับโอนเงิน 1,250.00 บาท จาก PROMPTPAY รหัสรายการ: SCB991823712",
  },
  {
    id: "TX-1004",
    time: "09:12:05",
    provider: "KTB",
    amount: 450.0,
    refId: "KTB000998811",
    sender: "Malee T.",
    webhookStatus: "success",
    orderNo: "ORD-20260731-004",
    rawText: "เงินเข้าบัญชี x1234 จำนวน 450.00 บาท Ref: KTB000998811",
  },
  {
    id: "TX-1005",
    time: "08:30:19",
    provider: "TTB",
    amount: 80.0,
    refId: "TTB77665512",
    sender: "Siriwat P.",
    webhookStatus: "failed",
    rawText: "เงินเข้า +80.00 บาท เข้าบัญชี 123-x-xxxxx-4 รหัส: TTB77665512",
  },
];

export function ActivityFeed() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.refId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery) ||
      (tx.orderNo && tx.orderNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProvider = selectedProvider === "ALL" || tx.provider === selectedProvider;

    return matchesSearch && matchesProvider;
  });

  const simulateNewTransaction = () => {
    const providers: Array<TransactionRecord["provider"]> = ["KBANK", "SCB", "KTB", "TTB", "TrueMoney"];
    const randomProvider = providers[Math.floor(Math.random() * providers.length)];
    const amounts = [150, 250, 500, 1200, 890, 99.5];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    const newTx: TransactionRecord = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      time: timeStr,
      provider: randomProvider,
      amount: randomAmount,
      refId: `${randomProvider.substring(0, 3)}${randomId}`,
      sender: "LINE Customer",
      webhookStatus: "success",
      orderNo: `ORD-20260731-${Math.floor(100 + Math.random() * 900)}`,
      rawText: `เงินเข้า ${randomAmount.toFixed(2)} บาท จาก LINE Customer รหัสอ้างอิง ${randomProvider.substring(0, 3)}${randomId}`,
    };

    setTransactions([newTx, ...transactions]);
  };

  const getProviderBadge = (provider: TransactionRecord["provider"]) => {
    switch (provider) {
      case "KBANK":
        return <Badge variant="kbank">KBANK Live</Badge>;
      case "SCB":
        return <Badge variant="scb">SCB Connect</Badge>;
      case "KTB":
        return <Badge variant="ktb">KTB Connext</Badge>;
      case "TTB":
        return <Badge variant="ttb">TTB Bank</Badge>;
      case "TrueMoney":
        return <Badge variant="truemoney">TrueMoney</Badge>;
      default:
        return <Badge variant="outline">{provider}</Badge>;
    }
  };

  const getStatusBadge = (status: TransactionRecord["webhookStatus"]) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Dispatched
          </span>
        );
      case "duplicate":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Info className="w-3 h-3" /> Duplicate
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500 border border-red-500/30">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            Pending
          </span>
        );
    }
  };

  return (
    <>
      <Card className="border border-border/80 shadow-none bg-card p-6 space-y-5">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Live Notification & Webhook Feed
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time payment notifications parsed from LINE alerts and dispatched to Fastory API
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={simulateNewTransaction}
              className="gap-2 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Simulate Payment Alert
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search Ref ID, order, sender..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-background/50 border-border rounded-xl"
            />
          </div>

          {/* Provider Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            {["ALL", "KBANK", "SCB", "KTB", "TTB", "TrueMoney"].map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvider(prov)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  selectedProvider === prov
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/40 hover:bg-muted text-muted-foreground border-border/60"
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-border/60 overflow-hidden bg-background/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Ref ID / Transaction</th>
                  <th className="py-3 px-4">Amount (THB)</th>
                  <th className="py-3 px-4">Matched Order</th>
                  <th className="py-3 px-4 text-right">Webhook Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-surface-hover/70 cursor-pointer transition-colors duration-150 group"
                    >
                      <td className="py-3.5 px-4 font-mono text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        {tx.time}
                      </td>
                      <td className="py-3.5 px-4">{getProviderBadge(tx.provider)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-foreground block">
                          {tx.refId}
                        </span>
                        <span className="text-[10px] text-muted-foreground">From: {tx.sender}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-500 text-sm">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.orderNo ? (
                          <span className="font-mono text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {tx.orderNo}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">{getStatusBadge(tx.webhookStatus)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No transaction records matched your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="sm:max-w-[450px] bg-surface border-border p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Transaction Detail ({selectedTx.id})
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Raw notification payload and Fastory WebhooksRoutes payload summary
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-border/80 shadow-none bg-card bg-muted/30 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Payment Provider</span>
                  {getProviderBadge(selectedTx.provider)}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Amount Received</span>
                  <span className="font-mono font-bold text-base text-emerald-500">
                    {formatCurrency(selectedTx.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Transaction Ref</span>
                  <span className="font-mono font-medium text-foreground">{selectedTx.refId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Webhook Status</span>
                  {getStatusBadge(selectedTx.webhookStatus)}
                </div>
              </div>

              {/* Raw Notification Text */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground block">
                  Raw LINE Notification Text:
                </span>
                <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-muted-foreground break-all leading-relaxed">
                  {selectedTx.rawText}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)} className="text-xs">
                  Close Detail
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
