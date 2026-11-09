"use server";

import { db } from "@wallet/db";
import { TxActionResponse } from "@wallet/common";
import { resolveWalletAndAuth, checkIdempotency } from "@wallet/auth/actions/tx.action-guard";

interface DepositActionInput {
  amount: number;
  paymentMethod?: string;
  idempotencyKey: string;
}

export async function initDepositAction({
  amount,
  idempotencyKey,
}: DepositActionInput): Promise<TxActionResponse> {
  if (!amount || amount < 100) {
    throw new Error("Minimum deposit amount is ₹100.");
  }

  const { walletId } = await resolveWalletAndAuth(false);

  const existingTransaction = await checkIdempotency(idempotencyKey);
  if (existingTransaction) {
    if (existingTransaction.status === "PENDING") {
      return { success: true, id: existingTransaction.id };
    }

    throw new Error(
      "This transaction attempt has already concluded. Please refresh the page and try a new deposit.",
    );
  }

  const transaction = await db.transaction.create({
    data: {
      amount: amount * 100,
      type: "DEPOSIT",
      status: "PENDING",
      idempotencyKey: idempotencyKey,
      sourceWalletId: null,
      destinationWalletId: walletId,
    },
    select: {
      id: true,
    },
  });

  return { success: true, id: transaction.id };
}