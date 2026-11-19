"use server";

import { redirect } from "next/navigation";
import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../index";
import { AppError } from "@wallet/common";

export async function switchAppModeAction(targetMode: "user" | "merchant") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new AppError("Unauthorized");
  }

  const userAppUrl =
    process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";
  const merchantAppUrl =
    process.env.NEXT_PUBLIC_MERCHANT_APP_URL || "http://localhost:3003";

  if (targetMode === "user") {
    redirect(`${userAppUrl}/dashboard`);
  }

  // Target mode === "merchant"
  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!merchantProfile) {
    redirect(`${merchantAppUrl}/onboarding`);
  }

  redirect(`${merchantAppUrl}/dashboard`);
}
