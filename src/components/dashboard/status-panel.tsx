"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Server, MessageSquare, Link as LinkIcon, CheckCircle2, ShieldCheck, Play, Square } from "lucide-react";

export function StatusPanel() {
  const { user, isAuthenticated } = useAuth();
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/webhook");

  const handleToggleServer = () => {
    setIsServerRunning(!isServerRunning);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="border border-border/80 shadow-none bg-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            บัญชีผู้ใช้ LINE
          </CardTitle>
          <CardDescription>สถานะการเชื่อมต่อ LINE Account</CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-border/50">
              <img
                src={user.pictureUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                alt={user.displayName}
                className="w-14 h-14 rounded-full border-2 border-[#06C755] object-cover shadow-sm"
              />
              <div className="flex-1">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  {user.displayName}
                  <CheckCircle2 className="w-4 h-4 text-[#06C755]" />
                </h4>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {user.userId}</p>
                <Badge variant="outline" className="mt-2 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/30 text-[10px]">
                  เชื่อมต่อสำเร็จ
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center bg-background/50 rounded-xl border border-dashed border-border">
              <div className="w-12 h-12 rounded-full bg-[#06C755]/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-[#06C755]" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">ยังไม่ได้เชื่อมต่อบัญชี</p>
              <p className="text-xs text-muted-foreground mb-4">กรุณาล็อกอิน LINE เพื่อเริ่มต้นใช้งาน</p>
              <Button 
                variant="line" 
                size="sm" 
                onClick={() => window.dispatchEvent(new CustomEvent('open-line-login'))}
                className="w-full sm:w-auto h-9 text-xs"
              >
                เชื่อมต่อ LINE
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider & Server Config */}
      <Card className="border border-border/80 shadow-none bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            ตั้งค่าเซิร์ฟเวอร์
          </CardTitle>
          <CardDescription>เลือกธนาคารและตั้งค่าปลายทาง</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">เลือกธนาคาร (Provider)</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative flex items-center p-4 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-full bg-[#1DB2E9] flex items-center justify-center mr-3 shrink-0">
                  {/* Krungthai icon placeholder */}
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-foreground">Krungthai Connext</h5>
                  <p className="text-xs text-muted-foreground">อ่านข้อความแจ้งเตือนจากแอปเป๋าตัง</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                </div>
              </div>
              {/* Future providers can go here, muted for now */}
              <div className="relative flex items-center p-4 border border-border/50 bg-background/30 rounded-xl opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-muted-foreground">อื่นๆ (เร็วๆนี้)</h5>
                  <p className="text-xs text-muted-foreground">รองรับเพิ่มเติมในอนาคต</p>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Config */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Webhook URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="pl-9 h-11 bg-background/50"
                placeholder="https://your-server.com/api/webhook"
                disabled={isServerRunning}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">URL ปลายทางสำหรับส่งข้อมูลยอดเงินที่ตรวจจับได้</p>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-6">
          <Button
            onClick={handleToggleServer}
            variant={isServerRunning ? "destructive" : "default"}
            className={`w-full h-12 text-sm font-bold transition-all duration-200 ${
              isServerRunning 
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30" 
                : ""
            }`}
          >
            {isServerRunning ? (
              <>
                <Square className="w-4 h-4 mr-2 fill-current" />
                หยุดเซิร์ฟเวอร์
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2 fill-current" />
                เริ่มทำงาน (Start Server)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
