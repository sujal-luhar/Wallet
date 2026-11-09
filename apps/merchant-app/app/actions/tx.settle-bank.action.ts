"use server";

import { db } from "@wallet/db";
import { revalidatePath } from "next/cache";
import { resolveWalletAndAuth, checkIdempotency } from "@wallet/auth/actions/tx.action-guard";
import { TxActionResponse } from "@wallet/common";

interface SettleToBankInput {
  amount: number;
  idempotencyKey: string;
}

export async function handleSettleToBank({ amount, idempotencyKey }: SettleToBankInput) : Promise<TxActionResponse> {
  if (!amount || amount <= 0) {
    throw new Error("Invalid settlement amount.");
  }

  const { walletId } = await resolveWalletAndAuth(true);
  const amountCents = BigInt(Math.round(amount * 100));

  const existingTx = await checkIdempotency(idempotencyKey);
  if (existingTx) {
    return { success: true, id: existingTx.id };
  }

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
    });

    transactionId = newTx.id;
  });

  const mockBankUrl = process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";
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
}