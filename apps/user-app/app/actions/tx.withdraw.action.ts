"use server";

import { db, Prisma } from "@wallet/db";
import {
  resolveWalletAndAuth,
  checkIdempotency,
} from "@wallet/auth/actions/tx.action-guard";
import {
  safeAction,
  withdrawSchema,
  WithdrawInput,
  TxActionResponse,
} from "@wallet/common";

async function executeWithdrawal({
  amount,
  idempotencyKey,
}: WithdrawInput): Promise<TxActionResponse> {
  const { walletId } = await resolveWalletAndAuth(false);
  const amountPaise = BigInt(Math.round(amount * 100));

  const resume = (tx: NonNullable<Awaited<ReturnType<typeof checkIdempotency>>>) => {
    // Same key must mean same intent, and must belong to this wallet.
    const sameIntent =
      tx.type === "WITHDRAWAL" &&
      tx.sourceWalletId === walletId &&
      tx.destinationWalletId === null &&
      tx.amount === amountPaise;

    // Deliberately generic: don't reveal that the key exists for someone else.
    if (!sameIntent) throw new Error("Invalid request. Please start a new withdrawal.");

    if (tx.status === "PENDING" || tx.status === "PROCESSING") {
      return { success: true as const, id: tx.id };
    }

    throw new Error(
      "This withdrawal attempt has already concluded. Please start a new withdrawal.",
    );
  };

  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return resume(existing);

  try {
    // Atomic Database Operation: Check balance + Deduct balance + Increment locked + Log PENDING Tx
    const transaction = await db.$transaction(async (tx) => {
      // 1. Lock wallet row & check balance atomically using raw SQL FOR UPDATE
      const wallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
        SELECT balance FROM "Wallet" 
        WHERE id = ${walletId} 
        FOR UPDATE;
      `;

      const currentWallet = wallets[0];

      if (!currentWallet || currentWallet.balance < amountPaise) {
        throw new Error("Insufficient wallet balance.");
      }

      // 2. Deduct from balance and move to locked balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amountPaise },
          locked: { increment: amountPaise }, // Track pending withdrawal safely
        },
      });

      // 3. Create PENDING withdrawal record
      return await tx.transaction.create({
        data: {
          amount: amountPaise,
          type: "WITHDRAWAL",
          status: "PENDING",
          idempotencyKey,
          sourceWalletId: walletId,
          destinationWalletId: null,
        },
        select: { id: true },
      });
    });

    // 4. Trigger Server-to-Server Payout Call to Express Mock Bank
    const bankBaseUrl =
      process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";

    try {
      await fetch(`${bankBaseUrl}/mock-bank/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txId: transaction.id,
          amount: Number(amountPaise),
          destinationAccount: "HDFC_••••_4092",
        }),
      });
    } catch (err) {
      console.error("Failed to notify mock bank:", err);
    }

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

export const initiateWithdrawalAction = safeAction(
  withdrawSchema,
  executeWithdrawal,
);
