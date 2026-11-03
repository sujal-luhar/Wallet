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
    // 1. Lock and fetch sender balance atomically using raw SQL FOR UPDATE
    const senderWallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM "Wallet" 
    WHERE id = ${senderWallet.id} 
    FOR UPDATE;
  `;

    const currentSenderWallet = senderWallets[0];

    if (
      !currentSenderWallet ||
      currentSenderWallet.balance < BigInt(amountInPaise)
    ) {
      throw new Error("Insufficient wallet balance.");
    }

    // 2. Deduct from Sender
    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: {
        balance: { decrement: amountInPaise },
      },
    });

    // 3. Credit to Recipient
    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: {
        balance: { increment: amountInPaise },
      },
    });

    // 4. Create INSTANT SUCCESS Transaction Record
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
