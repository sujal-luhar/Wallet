"use server";

import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

interface MerchantPaymentInput {
  merchantId: string; // Business/Merchant Identifier or phone
  amount: number;     // Amount in Rupees
  idempotencyKey: string;
}

export async function initMerchantPaymentAction({
  merchantId,
  amount,
  idempotencyKey,
}: MerchantPaymentInput) {
  // 1. Validation
  if (!amount || amount < 1) {
    throw new Error("Minimum payment amount is ₹1.");
  }

  const amountInPaise = amount * 100;
  const senderWallet = await getWalletBalance();

  if (!senderWallet?.id) {
    throw new Error("Unauthorized.");
  }

  // 2. Idempotency Check
  const existingTx = await db.transaction.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
  if (existingTx) {
    return { id: existingTx.id };
  }

  // 3. Find Merchant Wallet
  // Search MerchantProfile by ID, or by the User's phone linked to the profile
  const merchantProfile = await db.merchantProfile.findFirst({
    where: {
      OR: [
        { id: merchantId },
        { user: { phone: merchantId } },
      ],
    },
    include: { Wallet: true },
  });

  if (!merchantProfile || !merchantProfile.Wallet) {
    throw new Error("Merchant profile not found.");
  }

  const destinationWallet = merchantProfile.Wallet;

  if (destinationWallet.id === senderWallet.id) {
    throw new Error("You cannot pay your own merchant wallet from your user wallet.");
  }

  // 4. Atomic Prisma Transaction
  const transaction = await db.$transaction(async (tx) => {
    // Lock & verify sender balance
    const currentSenderWallet = await tx.wallet.findUnique({
      where: { id: senderWallet.id },
      select: { balance: true },
    });

    if (!currentSenderWallet || currentSenderWallet.balance < BigInt(amountInPaise)) {
      throw new Error("Insufficient wallet balance.");
    }

    // Deduct from Sender User Wallet
    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: {
        balance: { decrement: amountInPaise },
      },
    });

    // Credit to Recipient Merchant Wallet
    await tx.wallet.update({
      where: { id: destinationWallet.id },
      data: {
        balance: { increment: amountInPaise },
      },
    });

    // Create MERCHANT_PAYMENT Transaction Record
    return await tx.transaction.create({
      data: {
        amount: amountInPaise,
        type: "MERCHANT_PAYMENT",
        status: "SUCCESS",
        idempotencyKey,
        sourceWalletId: senderWallet.id,
        destinationWalletId: destinationWallet.id,
      },
      select: { id: true },
    });
  });

  return { id: transaction.id };
}