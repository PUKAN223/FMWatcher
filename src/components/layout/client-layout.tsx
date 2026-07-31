"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { WindowControls } from "./window-controls";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Wallet } from "lucide-react";
import { LineLoginModal } from "@/components/auth/line-login-modal";
import { useAuth } from "@/context/auth-context";

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: "หน้าหลัก",
  transactions: "ประวัติการทำรายการ",
  settings: "ตั้งค่าระบบ",
};

export function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { isAuthenticated } = useAuth();
  const [isLineModalOpen, setIsLineModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenLogin = () => setIsLineModalOpen(true);
    window.addEventListener("open-line-login", handleOpenLogin);
    return () => window.removeEventListener("open-line-login", handleOpenLogin);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-clip bg-background">
        <header
          data-tauri-drag-region
          className="sticky top-0 z-10 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/90 backdrop-blur-md transition-[width,height] ease-linear px-3 select-none"
        >
          <div className="flex items-center gap-2 min-w-0" data-tauri-drag-region>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb data-tauri-drag-region>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/" className="flex items-center gap-1">
                    <Wallet size={15} className="text-emerald-500" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {segments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}

                {segments.length === 0 ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-xs text-foreground">
                      หน้าหลัก
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  segments.map((part, index) => {
                    const href = `/${segments.slice(0, index + 1).join("/")}`;
                    const isLast = index === segments.length - 1;
                    const label =
                      ROUTE_NAME_MAP[part.toLowerCase()] ||
                      part.charAt(0).toUpperCase() + part.slice(1);

                    return (
                      <React.Fragment key={href}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="font-medium text-xs text-foreground">
                              {label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={href} className="text-xs">
                              {label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2" data-tauri-drag-region>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-500 select-none">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">ระบบพร้อมทำงาน</span>
            </div>

            {/* Custom Desktop Window Controls */}
            <WindowControls />
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-clip p-4 sm:p-5 pt-4">
          {children}
        </div>
      </SidebarInset>

      <LineLoginModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
      />
    </SidebarProvider>
  );
}
