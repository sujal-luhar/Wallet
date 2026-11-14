// apps/merchant-app/components/app-header.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Header } from "@wallet/ui/components/header";
import { switchAppModeAction } from "@wallet/auth/actions/switchAppModeAction";

const USER_APP_URL =
  process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";


export function AppHeader({ currentApp }: { currentApp: "user" | "merchant" }) {
  const { data: session } = useSession();
  const callbackUrl = `${USER_APP_URL}/signin`

  return (
    <Header
      currentApp={currentApp}
      user={session?.user}
      onSignOut={() => signOut({ callbackUrl })}
      onSwitchAppMode={switchAppModeAction}
    />
  );
}
