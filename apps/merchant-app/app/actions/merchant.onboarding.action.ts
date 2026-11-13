"use server";

import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth"; // Adjust based on your auth setup
import { redirect } from "next/navigation";

export async function handleMerchantOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const businessName = formData.get("businessName") as string;
  const supportEmail = formData.get("supportEmail") as string;

  if (!businessName) {
    throw new Error("Business name is required");
  }

  // Check if profile already exists to prevent duplicate creation
  const existingProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existingProfile) {
    redirect("/dashboard");
  }

  // Create MerchantProfile and its dedicated business Wallet in a single transaction
  await db.merchantProfile.create({
    data: {
      userId: session.user.id,
      businessName,
      supportEmail: supportEmail || session.user.email,
      Wallet: {
        create: {
          balance: 0,
          currency: "INR",
        },
      },
    },
  });

  redirect("/dashboard");
}
