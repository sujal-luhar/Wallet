"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Landmark, History } from "lucide-react";
import { AppSidebar as SharedSidebar, type NavItem } from "@wallet/ui/components/app-sidebar";

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Settlements", href: "/settlements", icon: Landmark },
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