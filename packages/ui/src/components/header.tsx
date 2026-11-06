"use client";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Building2, User, LogOut, Loader2 } from "lucide-react";
import { useTransition } from "react";

export interface HeaderProps {
  currentApp: "user" | "merchant";
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onSignOut: () => void;
  onSwitchAppMode: (targetMode: "user" | "merchant") => Promise<void>;
}

export function Header({
  currentApp,
  user,
  onSignOut,
  onSwitchAppMode,
}: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleSwitchApp = () => {
    const targetMode = currentApp === "user" ? "merchant" : "user";
    startTransition(async () => {
      await onSwitchAppMode(targetMode);
    });
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
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentApp === "merchant" ? (
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
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={onSignOut}
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