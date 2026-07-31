"use client";

import {
  LayoutDashboard,
  ReceiptText,
  Settings,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

const navItems = [
  {
    title: "หน้าหลัก",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "ประวัติการทำรายการ",
    url: "/transactions",
    icon: ReceiptText,
  },
  {
    title: "ตั้งค่าระบบ",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <Sidebar
      collapsible="icon"
      className="text-sidebar-foreground/85 **:data-[sidebar=separator]:bg-sidebar-border/50"
      {...props}
    >
      <SidebarHeader className="h-14 flex items-center justify-center px-4 border-b border-border/60">
        <Link href="/" className="flex items-center gap-3 w-full overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight truncate text-foreground">
              FM Watcher
            </span>
            <span className="text-[9px] text-muted-foreground truncate">Desktop v1.0</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="gap-1 pt-4">
        <NavMain
          currentPath={pathname}
          items={navItems}
          label="เมนูหลัก"
        />
      </SidebarContent>
      
      <SidebarSeparator />
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
