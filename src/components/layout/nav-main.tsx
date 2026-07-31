"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number;
  isActive?: boolean;
  defaultOpen?: boolean;
  items?: {
    title: string;
    url: string;
    badge?: number;
  }[];
};

export function NavMain({
  items,
  label = "Menu",
  currentPath,
}: {
  label?: string;
  currentPath?: string;
  items: NavItem[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = Boolean(item.items?.length);
          const isItemActive = currentPath === item.url;
          const hasActiveSubItem =
            item.items?.some((subItem) => currentPath === subItem.url) ?? false;

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={isItemActive}
                  tooltip={item.title}
                  className="text-sidebar-foreground/80 data-[active=true]:bg-sidebar-accent/45 data-[active=true]:shadow-none"
                >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/15 px-1.5 text-[10px] font-semibold text-destructive">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              render={<SidebarMenuItem />}
              defaultOpen={
                item.defaultOpen ?? item.isActive ?? hasActiveSubItem
              }
              className="group/collapsible"
            >
              <CollapsibleTrigger render={<SidebarMenuButton
                isActive={isItemActive || hasActiveSubItem}
                tooltip={item.title}
                className="text-sidebar-foreground/80 data-[active=true]:bg-sidebar-accent/45 data-[active=true]:shadow-none"
              />}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/15 px-1.5 text-[10px] font-semibold text-destructive">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        render={<Link href={subItem.url} />}
                        isActive={currentPath === subItem.url}
                        className="text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent/45"
                      >
                          <span>{subItem.title}</span>
                          {subItem.badge != null && subItem.badge > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/15 px-1 text-[9px] font-semibold text-destructive">
                              {subItem.badge > 99 ? "99+" : subItem.badge}
                            </span>
                          )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
