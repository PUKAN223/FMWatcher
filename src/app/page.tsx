"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { TransactionPanel } from "@/components/dashboard/transaction-panel";
import { ServerControlPanel } from "@/components/dashboard/server-control-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QrCode,
  CheckCircle2,
  TrendingUp,
  Receipt,
} from "lucide-react";
import type { StoredTransaction } from "@/lib/storage/store";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);

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
    const handleNewTx = () => {
      fetchTransactions();
    };

    window.addEventListener("fm-watcher-transaction", handleNewTx);
    return () => window.removeEventListener("fm-watcher-transaction", handleNewTx);
  }, []);

  const totalRevenue = transactions.reduce(
    (acc, curr) => acc + parseFloat(curr.amount || "0"),
    0
  );

  const handleOpenLoginModal = () => {
    window.dispatchEvent(new CustomEvent("open-line-login"));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="flex justify-center">
            <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <QrCode className="size-6 text-emerald-500" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              เข้าสู่ระบบด้วย LINE
            </h1>
            <p className="text-xs text-muted-foreground">
              เชื่อมต่อบัญชีเพื่อเปิดใช้งานระบบเฝ้าระวังรายการรับเงิน
            </p>
          </div>

          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="pt-5 pb-5">
              <Button
                onClick={handleOpenLoginModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-none text-sm"
              >
                <QrCode className="size-4" />
                สแกน QR Code เพื่อเข้าสู่ระบบ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ภาพรวมระบบ
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          บัญชี: {user?.displayName}
        </p>
      </div>

      {/* Minimal Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Account Card */}
        <Card className="border border-border/50 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              บัญชี LINE
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2.5">
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.displayName}
                  className="size-7 rounded-full border border-border object-cover shrink-0"
                />
              ) : (
                <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {user?.displayName?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {user?.userId?.substring(0, 14)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card className="border border-border/50 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              ยอดรับเงินรวม
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono text-emerald-500">
              ฿{totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card className="border border-border/50 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              รายการทั้งหมด
            </CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono text-foreground">
              {transactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Transactions (Left) | Server Status (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <TransactionPanel />
        <ServerControlPanel />
      </div>
    </div>
  );
}
