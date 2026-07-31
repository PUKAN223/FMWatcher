"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Smartphone, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";

export function ProviderStatus() {
  const providers = [
    {
      name: "KBANK Live",
      category: "Thai Commercial Bank",
      badge: "kbank" as const,
      status: "Active",
      regexPattern: "(?:เงินเข้า|รับเงิน)\\s*([\\d,]+\\.\\d{2})",
      count: 22,
    },
    {
      name: "SCB Connect",
      category: "Thai Commercial Bank",
      badge: "scb" as const,
      status: "Active",
      regexPattern: "(?:รับโอนเงิน|เงินเข้า)\\s*([\\d,]+\\.\\d{2})",
      count: 14,
    },
    {
      name: "TrueMoney Wallet",
      category: "E-Wallet",
      badge: "truemoney" as const,
      status: "Active",
      regexPattern: "(?:ได้รับเงินโอน|รับเงิน)\\s*([\\d,]+\\.\\d{2})",
      count: 8,
    },
    {
      name: "KTB Connext",
      category: "Thai Commercial Bank",
      badge: "ktb" as const,
      status: "Active",
      regexPattern: "(?:จำนวน|รับเงิน)\\s*([\\d,]+\\.\\d{2})",
      count: 4,
    },
  ];

  return (
    <Card className="border border-border/80 shadow-none bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            Payment Provider Listeners
          </h3>
          <p className="text-xs text-muted-foreground">
            Supported LINE Official notification templates & regex parsers
          </p>
        </div>

        <Badge variant="success" className="gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          5 Active Channels
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((prov, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-background/40 border border-border/60 hover:border-primary/30 transition-all duration-150 flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={prov.badge}>{prov.name}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {prov.category}
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                {prov.regexPattern}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold font-mono text-foreground">
                {prov.count} alerts
              </span>
              <span className="text-[10px] text-emerald-500 font-medium flex items-center justify-end gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Ready
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
