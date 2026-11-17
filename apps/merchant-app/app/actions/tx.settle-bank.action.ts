"use server";

import { db, Prisma } from "@wallet/db";
import { revalidatePath } from "next/cache";
import {
  resolveWalletAndAuth,
  checkIdempotency,
} from "@wallet/auth/actions/tx.action-guard";
import {
  safeAction,
  settleToBankSchema,
  SettleToBankInput,
  TxActionResponse,
} from "@wallet/common";

async function executeSettleToBank({
  amount,
  idempotencyKey,
}: SettleToBankInput): Promise<TxActionResponse> {
  const { walletId } = await resolveWalletAndAuth(true);
  const amountCents = BigInt(Math.round(amount * 100));

  const resume = (tx: NonNullable<Awaited<ReturnType<typeof checkIdempotency>>>) => {
    // Same key must mean same intent, and must belong to this wallet.
    const sameIntent =
      tx.type === "WITHDRAWAL" &&
      tx.sourceWalletId === walletId &&
      tx.destinationWalletId === null &&
      tx.amount === amountCents;

    // Deliberately generic: don't reveal that the key exists for someone else.
    if (!sameIntent) throw new Error("Invalid request. Please start a new settlement.");

    if (tx.status === "PENDING" || tx.status === "PROCESSING") {
      return { success: true as const, id: tx.id };
    }

    throw new Error(
      "This settlement attempt has already concluded. Please start a new settlement.",
    );
  };

  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return resume(existing);

  try {
    let transactionId = "";
    await db.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
        SELECT balance FROM "Wallet" 
        WHERE id = ${walletId} 
        FOR UPDATE;
      `;

      const currentWallet = wallets[0];
      if (!currentWallet || currentWallet.balance < amountCents) {
        throw new Error("Insufficient available balance for settlement.");
      }

      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amountCents },
          locked: { increment: amountCents },
        },
      });

      const newTx = await tx.transaction.create({
        data: {
          amount: amountCents,
          type: "WITHDRAWAL",
          status: "PROCESSING",
          sourceWalletId: walletId,
          destinationWalletId: null,
          idempotencyKey,
        },
        select: { id: true },
      });

      transactionId = newTx.id;
    });

    const mockBankUrl =
      process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";
    fetch(`${mockBankUrl}/mock-bank/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txId: transactionId,
        amount: Number(amountCents),
        destinationAccount: "MERCHANT_BANK_ACC",
      }),
    }).catch((err) => console.error("Error triggering mock bank payout:", err));

    revalidatePath("/dashboard");
    revalidatePath("/settlements");

    return { success: true, id: transactionId };
  } catch (e) {
    // Lost the race against a concurrent request with the same key.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await checkIdempotency(idempotencyKey);
      if (winner) return resume(winner);
    }
    throw e;
  }
}

export const handleSettleToBank = safeAction(
  settleToBankSchema,
  executeSettleToBank,
);
