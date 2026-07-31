"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  LogOut,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Smartphone,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface LineLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QrStep = "init" | "loading" | "qr_received" | "pincode_requested" | "error";

export function LineLoginModal({ isOpen, onClose }: LineLoginModalProps) {
  const {
    user,
    isAuthenticated,
    isAuthenticating,
    loginWithLine,
    logout,
  } = useAuth();

  const [qrStep, setQrStep] = useState<QrStep>("init");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling on unmount or modal close
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Poll real server status for @evex/linejs events
  const startPollingStatus = (sid: string) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/line/qr/status?sessionId=${sid}`);
        const data = await res.json();

        if (!data.success) {
          if (data.error) {
            setErrorMessage(data.error);
            setQrStep("error");
            stopPolling();
          }
          return;
        }

        // Real LINEJS status updates
        if (data.status === "qr" && data.qrUrl) {
          setQrUrl(data.qrUrl);
          setQrStep("qr_received");
        } else if (data.status === "pincode" && data.pincode) {
          setPincode(data.pincode);
          setQrStep("pincode_requested");
        } else if (data.status === "authenticated" && data.user) {
          stopPolling();
          // Complete login on context with real user data
          await loginWithLine(data.user, data.authToken);
          setQrStep("init");
        } else if (data.status === "error") {
          setErrorMessage(data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
          setQrStep("error");
          stopPolling();
        }
      } catch (err: any) {
        console.error("Error polling LINEJS status:", err);
      }
    }, 1000);
  };

  // Trigger real LINEJS QR session start
  const handleStartRealQRLogin = async () => {
    setQrStep("loading");
    setErrorMessage("");
    stopPolling();

    try {
      const res = await fetch("/api/line/qr/start", { method: "POST" });
      const data = await res.json();

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId);
        startPollingStatus(data.sessionId);
      } else {
        setErrorMessage(data.error || "ไม่สามารถเริ่มการเชื่อมต่อกับ LINE Server ได้");
        setQrStep("error");
      }
    } catch (err: any) {
      console.error("Error starting LINEJS login:", err);
      setErrorMessage("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      setQrStep("error");
    }
  };

  const resetModalState = () => {
    stopPolling();
    setQrStep("init");
    setSessionId(null);
    setQrUrl("");
    setPincode("");
    setErrorMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetModalState();
      onClose();
    }}>
      <DialogContent className="sm:max-w-[440px] bg-background border-border shadow-lg rounded-2xl p-0 overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                FM Watcher - LINE QR Login
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                เชื่อมต่อบัญชีผ่าน LINEJS (`@evex/linejs`) แบบใช้งานจริง
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isAuthenticated && user ? (
            /* CONNECTED USER PROFILE VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.pictureUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                    alt={user.displayName}
                    className="w-14 h-14 rounded-full border-2 border-[#06C755] object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base truncate text-foreground">
                        {user.displayName}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/30">
                        <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                      ID: {user.userId}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background/80 p-2 rounded-lg border border-border/50">
                    <span className="text-muted-foreground block text-[10px]">LINE Device</span>
                    <span className="font-mono font-semibold text-foreground">DESKTOPWIN</span>
                  </div>
                  <div className="bg-background/80 p-2 rounded-lg border border-border/50">
                    <span className="text-muted-foreground block text-[10px]">สถานะการรับงาน</span>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> พร้อมใช้งาน
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartRealQRLogin()}
                  className="gap-2 text-xs border-border"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  สแกนเปลี่ยนบัญชี
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    logout();
                    resetModalState();
                  }}
                  className="gap-2 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          ) : (
            /* REAL LINEJS QR CODE LOGIN FLOW */
            <div className="space-y-4">
              {/* STEP 1: START QR LOGIN */}
              {qrStep === "init" && (
                <div className="space-y-5 text-center py-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#06C755]/10 flex items-center justify-center text-[#06C755] border border-[#06C755]/20">
                    <QrCode className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-foreground">
                      เข้าสู่ระบบด้วย LINE QR Code (ใช้งานจริง)
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      กดปุ่มเพื่อเริ่มสร้างการเชื่อมต่อกับ LINE Server ผ่าน `@evex/linejs`
                    </p>
                  </div>

                  <Button
                    onClick={handleStartRealQRLogin}
                    className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold gap-2 h-11 rounded-xl"
                  >
                    <QrCode className="w-4 h-4" />
                    สร้าง Online QR Code (LINEJS)
                  </Button>
                </div>
              )}

              {/* LOADING STATE */}
              {qrStep === "loading" && (
                <div className="space-y-4 text-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-[#06C755] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      กำลังสร้างการเชื่อมต่อกับ LINE Server...
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      กำลังส่งคำขอสร้าง QR Code ผ่านโปรโตคอล LINEJS
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: REAL QR CODE DISPLAYED */}
              {qrStep === "qr_received" && (
                <div className="space-y-4 text-center py-1">
                  {/* Real QR Code Image from qrserver API */}
                  <div className="p-3 bg-white rounded-xl border border-border inline-block shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                      alt="LINE Login QR Code"
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  {/* Real-time status polling banner */}
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังรอการสแกนจากแอป LINE บนมือถือของคุณ...</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#06C755]" />
                      สแกนด้วยแอป LINE บนมือถือ (เมื่อสแกนแล้ว PIN จะแสดงให้อัตโนมัติ)
                    </h4>
                  </div>

                  <div className="pt-1 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetModalState()}
                      className="text-xs"
                    >
                      ยกเลิก / รีเซ็ต
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: AUTOMATICALLY DISPLAYED REAL PINCODE */}
              {qrStep === "pincode_requested" && (
                <div className="space-y-4 text-center py-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06C755]/15 text-[#06C755] text-xs font-semibold border border-[#06C755]/30">
                    <Sparkles className="w-3.5 h-3.5" /> ตรวจพบการสแกนแล้ว!
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      กรอก PIN Code นี้บนแอป LINE ในมือถือ
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      แอป LINE บนมือถือจะแสดงช่องให้กรอกรหัสยืนยัน 4 หลักนี้
                    </p>
                  </div>

                  {/* Real PIN Code display */}
                  <div className="flex justify-center items-center gap-2.5 py-2">
                    {pincode.split("").map((digit, idx) => (
                      <div
                        key={idx}
                        className="w-14 h-16 bg-muted/80 border-2 border-[#06C755] rounded-xl flex items-center justify-center text-2xl font-mono font-bold text-foreground shadow-xs animate-pulse"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#06C755]" />
                    กำลังรอยืนยัน PIN Code จากมือถือ... เมื่อป้อนรหัสแล้วจะเข้าสู่ระบบให้อัตโนมัติ
                  </div>

                  <div className="pt-1 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetModalState()}
                      className="text-xs"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {qrStep === "error" && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      เกิดข้อผิดพลาดในการเชื่อมต่อ
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {errorMessage || "ไม่สามารถเชื่อมต่อ LINE Server ได้"}
                    </p>
                  </div>

                  <Button
                    onClick={handleStartRealQRLogin}
                    className="w-full bg-primary text-primary-foreground text-xs h-10 rounded-xl"
                  >
                    ลองใหม่อีกครั้ง
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
