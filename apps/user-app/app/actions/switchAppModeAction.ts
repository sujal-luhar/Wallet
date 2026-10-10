"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@wallet/db";
import { getWalletBalance } from "@/dal/dashboard";

export async function switchAppModeAction(targetMode: "user" | "merchant") {
  const userWallet = await getWalletBalance();
  if (!userWallet?.id) {
    throw new Error("Unauthorized.");
  }

  const cookieStore = await cookies();

  if (targetMode === "user") {
    cookieStore.set("app_mode", "user", { path: "/" });
    redirect("/dashboard");
  }

  // Target mode === "merchant"
  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: userWallet.id },
  });

  if (!merchantProfile) {
    redirect(`${process.env.NEXT_PUBLIC_MERCHANT_APP_URL}/onboarding`);
  }

  cookieStore.set("app_mode", "merchant", { path: "/" });
  redirect(`${process.env.NEXT_PUBLIC_MERCHANT_APP_URL}/dashboard`);
}