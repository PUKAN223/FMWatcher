"use client";

import { CheckCircle2, ChevronsUpDown, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/auth-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => window.dispatchEvent(new CustomEvent('open-line-login'))}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group cursor-pointer"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#06C755]/10 text-[#06C755] group-hover:bg-[#06C755] group-hover:text-white transition-colors">
              <MessageSquare className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">ไม่ได้เข้าสู่ระบบ</span>
              <span className="truncate text-xs text-muted-foreground">เชื่อมต่อ LINE Account</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            />}>
              <Avatar className="h-8 w-8 rounded-lg border border-[#06C755]/30">
                <AvatarImage src={user.pictureUrl} alt={user.displayName} />
                <AvatarFallback className="rounded-lg bg-[#06C755]/10 text-[#06C755]">
                  LINE
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold flex items-center gap-1">
                  {user.displayName}
                  <CheckCircle2 className="size-3 text-[#06C755]" />
                </span>
                <span className="truncate text-xs text-muted-foreground">ID: {user.userId.substring(0, 8)}...</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg border border-[#06C755]/30">
                    <AvatarImage src={user.pictureUrl} alt={user.displayName} />
                    <AvatarFallback className="rounded-lg bg-[#06C755]/10 text-[#06C755]">
                      LINE
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      ID: {user.userId}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              logout();
              window.location.reload(); 
            }}>
              <LogOut className="mr-2 size-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
