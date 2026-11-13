"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownLeft,
  Send,
  History,
} from "lucide-react";
import { AppSidebar as SharedSidebar, type NavItem } from "@wallet/ui/components/app-sidebar";

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "P2P Transfer", href: "/p2ptransfer", icon: Send },
  { name: "Funds", href: "/funds", icon: ArrowDownLeft },
  { name: "Transactions", href: "/transactions", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SharedSidebar
      navigation={navigation}
      pathname={pathname}
      renderLink={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  );
}