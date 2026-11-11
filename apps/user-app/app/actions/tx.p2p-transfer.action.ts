"use server";

import { db } from "@wallet/db";
import { resolveWalletAndAuth, checkIdempotency } from "@wallet/auth/actions/tx.action-guard";
import { safeAction, p2pTransferSchema, P2PTransferInput, TxActionResponse } from "@wallet/common";

async function executeP2PTransfer({
  recipientPhone,
  amount,
  idempotencyKey,
}: P2PTransferInput): Promise<TxActionResponse> {
  const amountInPaise = amount * 100;
  const { walletId: senderWalletId } = await resolveWalletAndAuth(false);

  // 2. Idempotency Check
  const existingTx = await checkIdempotency(idempotencyKey);
  if (existingTx) {
    return { success: true, id: existingTx.id };
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

  if (recipientWallet.id === senderWalletId) {
    throw new Error("You cannot send money to your own wallet.");
  }

  // 4. Atomic Prisma Transaction (Instant Balance Transfer)
  const transaction = await db.$transaction(async (tx) => {
    // 1. Lock and fetch sender balance atomically using raw SQL FOR UPDATE
    const senderWallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM "Wallet" 
    WHERE id = ${senderWalletId} 
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
      where: { id: senderWalletId },
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
        sourceWalletId: senderWalletId,
        destinationWalletId: recipientWallet.id,
      },
      select: { id: true },
    });
  });

  return { success: true, id: transaction.id };
}

export const initP2PTransferAction = safeAction(p2pTransferSchema, executeP2PTransfer);