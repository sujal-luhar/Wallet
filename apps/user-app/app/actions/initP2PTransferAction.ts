"use server";

import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

interface P2PTransferInput {
  recipientPhone: string;
  amount: number; // Amount in Rupees
  idempotencyKey: string;
}

export async function initP2PTransferAction({
  recipientPhone,
  amount,
  idempotencyKey,
}: P2PTransferInput) {
  // 1. Validation
  if (!amount || amount < 1) {
    throw new Error("Minimum transfer amount is ₹1.");
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

  // 3. Find Recipient Wallet by Phone Number
  const recipientUser = await db.user.findUnique({
    where: { phone: recipientPhone },
    include: { Wallet: true }, // Ensure exact relation name (wallet / Wallet) matches your schema
  });

  if (!recipientUser || !recipientUser.Wallet) {
    throw new Error("Recipient phone number is not registered.");
  }

  const recipientWallet = recipientUser.Wallet;

  if (recipientWallet.id === senderWallet.id) {
    throw new Error("You cannot send money to your own wallet.");
  }

  // 4. Atomic Prisma Transaction (Instant Balance Transfer)
  const transaction = await db.$transaction(async (tx) => {
    // Lock & verify sender balance
    const currentSenderWallet = await tx.wallet.findUnique({
      where: { id: senderWallet.id },
      select: { balance: true },
    });

    if (
      !currentSenderWallet ||
      currentSenderWallet.balance < BigInt(amountInPaise)
    ) {
      throw new Error("Insufficient wallet balance.");
    }

    // Deduct from Sender
    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: {
        balance: { decrement: amountInPaise },
      },
    });

    // Credit to Recipient
    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: {
        balance: { increment: amountInPaise },
      },
    });

    // Create INSTANT SUCCESS Transaction Record
    return await tx.transaction.create({
      data: {
        amount: amountInPaise,
        type: "P2P_TRANSFER",
        status: "SUCCESS",
        idempotencyKey,
        sourceWalletId: senderWallet.id,
        destinationWalletId: recipientWallet.id,
      },
      select: { id: true },
    });
  });

  return { id: transaction.id };
}
