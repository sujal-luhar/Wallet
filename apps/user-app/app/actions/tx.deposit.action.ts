"use server";

import { db } from "@wallet/db";
import { resolveWalletAndAuth, checkIdempotency } from "@wallet/auth/actions/tx.action-guard";
import { safeAction, depositSchema, DepositInput, TxActionResponse } from "@wallet/common";

async function executeDeposit({
  amount,
  idempotencyKey,
}: DepositInput): Promise<TxActionResponse> {
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

export const initDepositAction = safeAction(depositSchema, executeDeposit);