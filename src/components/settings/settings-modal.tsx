"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, Key, Phone, Radio, Bell, CheckCircle2, Shield } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");
  const [webhookKey, setWebhookKey] = useState("your-secret-webhook-key");
  const [promptpayPhone, setPromptpayPhone] = useState("0812345678");
  const [port, setPort] = useState("9090");
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const savedApiUrl = localStorage.getItem("fastory_api_url");
    const savedWebhookKey = localStorage.getItem("fastory_webhook_key");
    const savedPhone = localStorage.getItem("store_promptpay_phone");
    const savedPort = localStorage.getItem("wallet_watcher_port");

    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedWebhookKey) setWebhookKey(savedWebhookKey);
    if (savedPhone) setPromptpayPhone(savedPhone);
    if (savedPort) setPort(savedPort);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("fastory_api_url", apiUrl);
    localStorage.setItem("fastory_webhook_key", webhookKey);
    localStorage.setItem("store_promptpay_phone", promptpayPhone);
    localStorage.setItem("wallet_watcher_port", port);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-surface border-border p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Server className="w-5 h-5 text-primary" /> FM Watcher System Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure Fastory backend webhooks, local listening port, and notification defaults
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Fastory API URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-primary" /> Fastory Backend API URL
            </label>
            <Input
              value={apiUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiUrl(e.target.value)}
              placeholder="e.g. http://localhost:8080"
              className="font-mono text-xs h-10 rounded-xl bg-background border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              Target API base URL for posting parsed payment webhooks
            </p>
          </div>

          {/* Webhook API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" /> Webhook API Key (`x-webhook-key`)
            </label>
            <Input
              type="password"
              value={webhookKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookKey(e.target.value)}
              placeholder="Secret webhook authentication key"
              className="font-mono text-xs h-10 rounded-xl bg-background border-border"
            />
          </div>

          {/* Store PromptPay Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" /> PromptPay Phone
              </label>
              <Input
                value={promptpayPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromptpayPhone(e.target.value)}
                placeholder="0812345678"
                className="font-mono text-xs h-10 rounded-xl bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 font-mono">
                <Radio className="w-3.5 h-3.5 text-primary" /> Daemon Port
              </label>
              <Input
                value={port}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPort(e.target.value)}
                placeholder="9090"
                className="font-mono text-xs h-10 rounded-xl bg-background border-border"
              />
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="p-3 rounded-xl bg-background/50 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Desktop OS Notifications
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Show popup notification when a payment alert is processed
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableDesktopNotifications}
              onChange={(e) => setEnableDesktopNotifications(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              Save Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
