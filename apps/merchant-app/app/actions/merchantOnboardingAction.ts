"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@wallet/db";
import { getWalletBalance } from "@/dal/dashboard"; // Your auth helper to get logged-in user

interface OnboardMerchantInput {
  businessName: string;
  supportEmail?: string;
}

export async function merchantOnboardingAction({
  businessName,
  supportEmail,
}: OnboardMerchantInput) {
  const userWallet = await getWalletBalance();
  const userId = userWallet?.id;

  if (!userId) {
    throw new Error("Unauthorized.");
  }

  if (!businessName.trim()) {
    throw new Error("Business name is required.");
  }

  // 1. Check if user already has a merchant profile
  const existingProfile = await db.merchantProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error("You already have a merchant profile.");
  }

  // 2. Create Merchant Profile + Dedicated Merchant Wallet in DB
  await db.$transaction(async (tx) => {
    const merchant = await tx.merchantProfile.create({
      data: {
        userId: userId,
        businessName: businessName.trim(),
        supportEmail: supportEmail?.trim() || null,
      },
    });

    await tx.wallet.create({
      data: {
        merchantId: merchant.id,
        balance: BigInt(0),
        currency: "INR",
      },
    });
  });

  // 3. Set app mode cookie and redirect to merchant dashboard
  (await cookies()).set("app_mode", "merchant", { path: "/" });
  redirect(`${process.env.NEXT_PUBLIC_MERCHANT_APP_URL}/dashboard`);
}