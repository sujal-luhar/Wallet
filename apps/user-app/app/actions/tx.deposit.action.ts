"use server";

import { db, Prisma } from "@wallet/db";
import {
  resolveWalletAndAuth,
  checkIdempotency,
} from "@wallet/auth/actions/tx.action-guard";
import {
  safeAction,
  depositSchema,
  DepositInput,
  TxActionResponse,
} from "@wallet/common";

async function executeDeposit({
  amount,
  idempotencyKey,
}: DepositInput): Promise<TxActionResponse> {
  const { walletId } = await resolveWalletAndAuth(false);
  const amountPaise = BigInt(Math.round(amount * 100));

  const resume = (tx: NonNullable<Awaited<ReturnType<typeof checkIdempotency>>>) => {
    // Same key must mean same intent, and must belong to this wallet.
    const sameIntent =
      tx.type === "DEPOSIT" &&
      tx.destinationWalletId === walletId &&
      tx.amount === amountPaise;

    // Deliberately generic: don't reveal that the key exists for someone else.
    if (!sameIntent) throw new Error("Invalid request. Please start a new deposit.");

    if (tx.status === "PENDING") return { success: true as const, id: tx.id };

    throw new Error(
      "This deposit attempt has already concluded. Please start a new deposit.",
    );
  };

  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return resume(existing);

  try {
    const tx = await db.transaction.create({
      data: {
        amount: amountPaise,
        type: "DEPOSIT",
        status: "PENDING",
        idempotencyKey,
        sourceWalletId: null,
        destinationWalletId: walletId,
      },
      select: { id: true },
    });

    return { success: true, id: tx.id };

  } catch (e) {
    // Lost the race against a concurrent request with the same key.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await checkIdempotency(idempotencyKey);
      if (winner) return resume(winner);
    }
    throw e;
  }
}
export const initDepositAction = safeAction(depositSchema, executeDeposit);
