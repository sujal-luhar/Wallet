"use client";

import type { ReactElement } from "react";
import { Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AppSidebarProps {
  navigation: NavItem[];
  pathname: string;
  brandName?: string;
  renderLink?: (props: {
    href: string;
    children: React.ReactNode;
  }) => ReactElement;
}

export function AppSidebar({
  navigation,
  pathname,
  brandName = "Wallet",
  renderLink,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex h-10 items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:text-sidebar-primary">
            <Wallet className="size-5 group-data-[collapsible=icon]:size-6" />
          </div>
          <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            {brandName}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon />
                  <span>{item.name}</span>
                </>
              );
              const link = renderLink
                ? renderLink({ href: item.href, children: content })
                : <a href={item.href}>{content}</a>;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-10 text-sm"
                    render={link}
                  />
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
