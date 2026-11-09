// apps/merchant-app/components/app-header.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Header } from "@wallet/ui/components/header";
import { switchAppModeAction } from "@wallet/auth/actions/switchAppModeAction";

export function AppHeader({ currentApp }: { currentApp: "user" | "merchant" }) {
  const { data: session } = useSession();

  return (
    <Header
      currentApp={currentApp}
      user={session?.user}
      onSignOut={() => signOut({ callbackUrl: "/signin" })}
      onSwitchAppMode={switchAppModeAction}
    />
  );
}
