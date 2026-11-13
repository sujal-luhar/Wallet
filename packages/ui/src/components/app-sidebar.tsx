import type { ComponentType } from "react";
import { Wallet } from "lucide-react";
import { cn } from "../lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface AppSidebarProps {
  navigation: NavItem[];
  pathname: string;
  brandName?: string;
  renderLink?: (props: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

export function AppSidebar({
  navigation,
  pathname,
  brandName = "Wallet",
  renderLink,
}: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card px-4 py-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">{brandName}</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const linkClassName = cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          );

          const content = (
            <>
              <Icon className="h-5 w-5" />
              {item.name}
            </>
          );

          if (renderLink) {
            return (
              <div key={item.href}>
                {renderLink({
                  href: item.href,
                  className: linkClassName,
                  children: content,
                })}
              </div>
            );
          }

          return (
            <a key={item.href} href={item.href} className={linkClassName}>
              {content}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}