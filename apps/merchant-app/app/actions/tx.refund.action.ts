"use server";

import { db } from "@wallet/db";
import { revalidatePath } from "next/cache";
import { resolveWalletAndAuth, assertValidRefundTarget } from "@wallet/auth/actions/tx.action-guard";
import { safeAction, refundSchema, RefundInput, TxActionResponse } from "@wallet/common";

// Pure business logic function (accepts validated data)
async function executeRefund({ transactionId }: RefundInput): Promise<TxActionResponse> {
  const { walletId: merchantWalletId } = await resolveWalletAndAuth(true);
  const { amount, sourceWalletId } = await assertValidRefundTarget(transactionId, merchantWalletId);

  await db.$transaction(async (dbTx) => {
    const wallets = await dbTx.$queryRaw<Array<{ balance: bigint }>>`
      SELECT balance FROM "Wallet" 
      WHERE id = ${merchantWalletId} 
      FOR UPDATE;
    `;

    const currentWallet = wallets[0];
    if (!currentWallet || currentWallet.balance < amount) {
      throw new Error("Insufficient wallet balance to issue refund.");
    }

    const updateResult = await dbTx.transaction.updateMany({
      where: { id: transactionId, status: "SUCCESS" },
      data: { status: "REFUNDED" },
    });

    if (updateResult.count === 0) {
      throw new Error("Transaction has already been refunded or is no longer eligible.");
    }

    await dbTx.wallet.update({
      where: { id: merchantWalletId },
      data: { balance: { decrement: amount } },
    });

    await dbTx.wallet.update({
      where: { id: sourceWalletId },
      data: { balance: { increment: amount } },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  
  return { success: true, id: transactionId };
}

// Exported Server Action wrapped with validation & safe error handling
export const refundTransactionAction = safeAction(refundSchema, executeRefund);