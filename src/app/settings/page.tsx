"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Info,
  Link as LinkIcon,
  Save,
  Send,
  Server,
  ShieldCheck,
  Key,
  Loader2,
} from "lucide-react";

type SettingsTab = "provider" | "webhook" | "channel";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "provider", label: "ผู้ให้บริการ", icon: Server },
  { id: "webhook", label: "Webhook & API Key", icon: LinkIcon },
  { id: "channel", label: "LINE Channel", icon: ShieldCheck },
];

export default function SettingsPage() {
  const { channelId, channelSecret, setChannelConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("webhook");

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/webhook");
  const [webhookApiKey, setWebhookApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookSavedSuccess, setWebhookSavedSuccess] = useState(false);

  // Channel state
  const [inputChannelId, setInputChannelId] = useState(channelId);
  const [inputChannelSecret, setInputChannelSecret] = useState(channelSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [channelSavedSuccess, setChannelSavedSuccess] = useState(false);

  // Fetch persisted settings from data/settings.json
  useEffect(() => {
    fetch("/api/watcher/control")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.webhookUrl) setWebhookUrl(data.settings.webhookUrl);
          if (data.settings.webhookApiKey) setWebhookApiKey(data.settings.webhookApiKey);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWebhook(true);
    try {
      await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          webhookApiKey,
        }),
      });
      setWebhookSavedSuccess(true);
      setTimeout(() => setWebhookSavedSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    setChannelConfig(inputChannelId, inputChannelSecret);
    setChannelSavedSuccess(true);
    setTimeout(() => setChannelSavedSuccess(false), 2500);
  };

  const handleTestWebhook = async () => {
    setTestSent(true);
    try {
      await fetch("/api/watcher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_webhook",
          webhookUrl,
          webhookApiKey,
        }),
      });
    } catch {
      // ignore
    }
    setTimeout(() => setTestSent(false), 2500);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ตั้งค่าระบบ
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          จัดการการเชื่อมต่อ Webhook URL, API Key และผู้ให้บริการ
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border/60">
        <nav className="flex gap-0" aria-label="การตั้งค่า">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer select-none",
                  isActive
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab: Webhook */}
      {activeTab === "webhook" && (
        <form onSubmit={handleSaveWebhook}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <Card className="border border-border/50 bg-card shadow-none">
                <CardHeader className="pb-3 px-6 pt-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="size-4 text-emerald-500" />
                    การตั้งค่า Webhook URL & Secret Key
                  </CardTitle>
                  <CardDescription className="text-xs">
                    กำหนด URL ปลายทางสำหรับรับข้อมูลแจ้งเตือนการรับเงินแบบเรียลไทม์
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6">
                  {/* Webhook Target URL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Webhook Target URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="font-mono text-xs h-9 bg-muted/20 border-border/60"
                        placeholder="http://localhost:3000/api/webhook"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 shrink-0 gap-1.5 text-xs border-border/60"
                        onClick={handleCopyWebhook}
                      >
                        {webhookCopied ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {webhookCopied ? "คัดลอกแล้ว" : "คัดลอก"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      ระบบจะส่ง HTTP POST พร้อม JSON Payload ไปยัง URL นี้ทันทีเมื่อตรวจพบเงินเข้า
                    </p>
                  </div>

                  {/* Webhook API Key (x-webhook-key) */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Key className="size-3.5 text-amber-500" />
                      Webhook API Key (ส่งใน Header: x-webhook-key)
                    </Label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={webhookApiKey}
                        onChange={(e) => setWebhookApiKey(e.target.value)}
                        className="font-mono text-xs h-9 bg-muted/20 border-border/60 pr-10"
                        placeholder="ระบุ API Key ป้องกันความปลอดภัย (ระบุหรือไม่ก็ได้)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      หากระบุ ค่านี้จะถูกส่งไปใน Header <code className="text-foreground font-mono">x-webhook-key</code> ของทุก Request
                    </p>
                  </div>

                  {webhookSavedSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                      <CheckCircle2 className="size-4 shrink-0" />
                      บันทึกการตั้งค่า Webhook ลงในระบบ (`data/settings.json`) เรียบร้อยแล้ว
                    </div>
                  )}

                  {testSent && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                      <CheckCircle2 className="size-4 shrink-0" />
                      ส่งสัญญาณทดสอบไปยัง Webhook URL เรียบร้อยแล้ว (ตรวจสอบใน Console Log)
                    </div>
                  )}
                </CardContent>

                {/* Footer Actions */}
                <CardFooter className="border-t border-border/50 bg-muted/10 px-6 py-3.5 flex justify-between items-center">
                  <Button
                    type="button"
                    onClick={handleTestWebhook}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs px-3 border-border/60"
                  >
                    <Send className="size-3.5 text-amber-500" />
                    ทดสอบส่ง Webhook
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingWebhook}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs px-5 shadow-none font-medium"
                  >
                    {isSavingWebhook ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span>บันทึกการตั้งค่า Webhook</span>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Side Info */}
            <div className="lg:col-span-4">
              <Card className="border border-border/50 shadow-none bg-card">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    รูปแบบ JSON Payload ที่ส่งออก
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs px-4 pb-4">
                  <pre className="font-mono bg-zinc-950 border border-border/40 rounded-md p-3 text-[10px] text-zinc-300 leading-relaxed overflow-x-auto">
{`{
  "id_pay": "LINE-1785478920-412",
  "ref1": "XX2481",
  "amount": "30.36",
  "amount_check": "3036",
  "balance": "1234.56",
  "date_pay": "2026-06-12 14:30",
  "timestamp": 1781212604,
  "webhook_status": "ok"
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Provider */}
      {activeTab === "provider" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <Card className="border border-border/50 shadow-none bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="size-4 text-emerald-500" />
                  ผู้ให้บริการแจ้งเตือนเงินเข้า
                </CardTitle>
                <CardDescription className="text-xs">
                  ระบบตรวจจับรายการเงินเข้าแบบอัตโนมัติผ่าน LINE Official Account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Krungthai Connext (กรุงไทย)</p>
                    <p className="text-[11px] text-muted-foreground">รองรับข้อความ Flex Message และแจ้งเตือนเงินเข้าทุกรูปแบบ</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">เปิดใช้งานแล้ว</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Channel */}
      {activeTab === "channel" && (
        <form onSubmit={handleSaveChannel}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <Card className="border border-border/50 shadow-none bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    LINE Channel Credentials
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ตั้งค่าข้อมูล Channel ID และ Channel Secret สำหรับยืนยันตัวตน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Channel ID</Label>
                    <Input
                      type="text"
                      value={inputChannelId}
                      onChange={(e) => setInputChannelId(e.target.value)}
                      className="font-mono text-xs h-9 bg-muted/20 border-border/60"
                      placeholder="165xxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Channel Secret</Label>
                    <div className="relative">
                      <Input
                        type={showSecret ? "text" : "password"}
                        value={inputChannelSecret}
                        onChange={(e) => setInputChannelSecret(e.target.value)}
                        className="font-mono text-xs h-9 bg-muted/20 border-border/60 pr-10"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {channelSavedSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                      <CheckCircle2 className="size-4 shrink-0" />
                      บันทึก LINE Channel Credentials สำเร็จ
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-border/50 bg-muted/10 px-6 py-3.5 flex justify-end">
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs px-5 shadow-none">
                    <Save className="size-3.5" />
                    <span>บันทึกตั้งค่า Channel</span>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
