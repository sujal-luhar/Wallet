// apps/user-app/components/header.tsx (or shared packages/ui header)
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@wallet/ui/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@wallet/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wallet/ui/components/ui/dropdown-menu";
import { Building2, User, LogOut } from "lucide-react";

interface HeaderProps {
  currentApp: "user" | "merchant";
}

export function Header({ currentApp = "user" }: HeaderProps) {
  const { data: session } = useSession();

  const userAppUrl = process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";
  const merchantAppUrl = process.env.NEXT_PUBLIC_MERCHANT_APP_URL || "http://localhost:3003";

  const handleSwitchApp = () => {
    if (currentApp === "user") {
      window.location.href = `${merchantAppUrl}/dashboard`;
    } else {
      window.location.href = `${userAppUrl}/dashboard`;
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold capitalize">
          {currentApp === "merchant" ? "Merchant Portal" : "Personal Wallet"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* App Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchApp}
          className="gap-2"
        >
          {currentApp === "merchant" ? (
            <>
              <User className="h-4 w-4" />
              Switch to User Profile
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Switch to Merchant Profile
            </>
          )}
        </Button>

        {/* User Avatar & Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-ring">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback>
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}