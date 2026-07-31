"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  ArrowUpRight,
  Send,
  ShieldCheck,
  Zap,
  Activity,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function StatCards() {
  const { isAuthenticated } = useAuth();

  const stats = [
    {
      title: "Total Revenue Today",
      value: formatCurrency(14250.0),
      subtext: "+18.4% from yesterday",
      icon: TrendingUp,
      accent: "from-emerald-500/20 to-teal-500/5",
      iconColor: "text-emerald-500",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Received Notifications",
      value: "48",
      subtext: "Parsed KBank, SCB & TrueMoney",
      icon: Activity,
      accent: "from-indigo-500/20 to-purple-500/5",
      iconColor: "text-indigo-500",
      badgeColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Dispatched Webhooks",
      value: "46 / 48",
      subtext: "95.8% Auto-Completion Rate",
      icon: Send,
      accent: "from-sky-500/20 to-blue-500/5",
      iconColor: "text-sky-500",
      badgeColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "LINE Webhook Daemon",
      value: isAuthenticated ? "Connected" : "Standby",
      subtext: isAuthenticated ? "LINE Official Account Active" : "Click 'Connect LINE' to pair",
      icon: MessageSquare,
      accent: isAuthenticated ? "from-[#06C755]/20 to-emerald-500/5" : "from-amber-500/20 to-orange-500/5",
      iconColor: isAuthenticated ? "text-[#06C755]" : "text-amber-500",
      badgeColor: isAuthenticated
        ? "text-[#06C755] bg-[#06C755]/10 border-[#06C755]/30"
        : "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className="border border-border/80 shadow-none bg-card p-5 relative overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br ${stat.accent} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`}
            />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center bg-background/80 border border-border/60 ${stat.iconColor} shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {stat.value}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stat.badgeColor}`}
                  >
                    {stat.subtext}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
