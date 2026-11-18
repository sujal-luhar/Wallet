"use server";

import { db, Prisma } from "@wallet/db";
import {
  resolveWalletAndAuth,
  checkIdempotency,
} from "@wallet/auth/actions/tx.action-guard";
import {
  safeAction,
  p2pTransferSchema,
  P2PTransferInput,
  TxActionResponse,
  AppError,
} from "@wallet/common";

async function executeP2PTransfer({
  recipientPhone,
  amount,
  idempotencyKey,
}: P2PTransferInput): Promise<TxActionResponse> {
  const { walletId: senderWalletId } = await resolveWalletAndAuth(false);
  const amountPaise = BigInt(Math.round(amount * 100));

  // Find Recipient Wallet by Phone Number
  const recipientUser = await db.user.findUnique({
    where: { phone: recipientPhone },
    include: { Wallet: true },
  });

  if (!recipientUser || !recipientUser.Wallet) {
    throw new AppError("Recipient phone number is not registered.");
  }

  const recipientWallet = recipientUser.Wallet;

  if (recipientWallet.id === senderWalletId) {
    throw new AppError("You cannot send money to your own wallet.");
  }

  const resume = (tx: NonNullable<Awaited<ReturnType<typeof checkIdempotency>>>) => {
    // Same key must mean same intent, and must belong to this wallet.
    const sameIntent =
      tx.type === "P2P_TRANSFER" &&
      tx.sourceWalletId === senderWalletId &&
      tx.destinationWalletId === recipientWallet.id &&
      tx.amount === amountPaise;

    // Deliberately generic: don't reveal that the key exists for someone else.
    if (!sameIntent) throw new AppError("Invalid request. Please start a new transfer.");

    if (tx.status === "SUCCESS" || tx.status === "PENDING") {
      return { success: true as const, id: tx.id };
    }

    throw new AppError(
      "This transfer attempt has already concluded. Please start a new transfer.",
    );
  };

  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return resume(existing);

  try {
    // Atomic Prisma Transaction (Instant Balance Transfer)
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
        currentSenderWallet.balance < amountPaise
      ) {
        throw new AppError("Insufficient wallet balance.");
      }

      // 2. Deduct from Sender
      await tx.wallet.update({
        where: { id: senderWalletId },
        data: {
          balance: { decrement: amountPaise },
        },
      });

      // 3. Credit to Recipient
      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: { increment: amountPaise },
        },
      });

      // 4. Create INSTANT SUCCESS Transaction Record
      return await tx.transaction.create({
        data: {
          amount: amountPaise,
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
  } catch (e) {
    // Lost the race against a concurrent request with the same key.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await checkIdempotency(idempotencyKey);
      if (winner) return resume(winner);
    }
    throw e;
  }
}

export const initP2PTransferAction = safeAction(
  p2pTransferSchema,
  executeP2PTransfer,
);
