"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

export async function switchAppModeAction(targetMode: "user" | "merchant") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();

  const userAppUrl =
    process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";
  const merchantAppUrl =
    process.env.NEXT_PUBLIC_MERCHANT_APP_URL || "http://localhost:3003";


  if (targetMode === "user") {
    cookieStore.set("app_mode", "user", { path: "/" });
    redirect(`${userAppUrl}/dashboard`);
  }

  // Target mode === "merchant"
  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!merchantProfile) {
    redirect(`${merchantAppUrl}/onboarding`);
  }

  cookieStore.set("app_mode", "merchant", { path: "/" });
  redirect(`${merchantAppUrl}/dashboard`);
}
