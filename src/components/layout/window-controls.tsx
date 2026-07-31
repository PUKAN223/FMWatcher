"use client";

import React, { useEffect, useState } from "react";
import { Minus, Square, Copy, X } from "lucide-react";

export function WindowControls() {
  const [isTauri, setIsTauri] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window")
        .then(({ getCurrentWindow }) => {
          const win = getCurrentWindow();
          setAppWindow(win);
          setIsTauri(true);

          win.isMaximized().then(setIsMaximized).catch(() => {});
          win.onResized(() => {
            win.isMaximized().then(setIsMaximized).catch(() => {});
          });
        })
        .catch(() => {
          setIsTauri(false);
        });
    }
  }, []);

  const handleMinimize = async () => {
    if (appWindow) {
      await appWindow.minimize().catch(() => {});
    }
  };

  const handleToggleMaximize = async () => {
    if (appWindow) {
      await appWindow.toggleMaximize().catch(() => {});
      const max = await appWindow.isMaximized().catch(() => false);
      setIsMaximized(max);
    }
  };

  const handleClose = async () => {
    if (appWindow) {
      await appWindow.close().catch(() => {});
    }
  };

  if (!isTauri) return null;

  return (
    <div className="flex items-center gap-1 border-l border-border/50 pl-2 select-none" data-tauri-drag-region>
      <button
        type="button"
        onClick={handleMinimize}
        title="Minimize"
        className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={handleToggleMaximize}
        title={isMaximized ? "Restore" : "Maximize / Fullscreen"}
        className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
      >
        {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
      </button>

      <button
        type="button"
        onClick={handleClose}
        title="Close"
        className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-rose-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
