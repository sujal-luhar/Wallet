"use server";

import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

interface DepositActionInput {
  amount: number;
  paymentMethod?: string;
  idempotencyKey: string;
}

export async function initDepositAction({
  amount,
  idempotencyKey,
}: DepositActionInput) {
  if (!amount || amount < 100) {
    throw new Error("Minimum deposit amount is ₹100.");
  }

  const wallet = await getWalletBalance();
  if (!wallet?.id) {
    throw new Error("Unauthorized or wallet not found.");
  }

  const existingTransaction = await db.transaction.findUnique({
    where: { idempotencyKey },
    select: { id: true, status: true },
  });

  if (existingTransaction) {
    if (existingTransaction.status === "PENDING") {
      return existingTransaction;
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
      destinationWalletId: wallet.id,
    },
    select: {
      id: true,
    },
  });

  return transaction;
}
