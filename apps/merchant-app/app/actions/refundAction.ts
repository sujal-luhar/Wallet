"use server";

import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@wallet/auth";

export async function refundTransactionAction(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. Fetch basic merchant profile to get the wallet ID
  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, Wallet: { select: { id: true } } },
  });

  if (!merchantProfile?.Wallet) throw new Error("Merchant wallet not found");
  const merchantWalletId = merchantProfile.Wallet.id;

  // 2. Fetch basic transaction details for initial validation
  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, amount: true, status: true, destinationWalletId: true, sourceWalletId: true },
  });

  if (!tx || tx.destinationWalletId !== merchantWalletId) {
    throw new Error("Transaction not found or unauthorized.");
  }

  if (tx.status !== "SUCCESS") {
    throw new Error("Only successful transactions can be refunded.");
  }

  if (!tx.sourceWalletId) {
    throw new Error("Invalid source wallet for refund.");
  }

  const amount = tx.amount;

  if (!tx.sourceWalletId) {
    throw new Error("Invalid source wallet for refund.");
  }

  // Store it in a constant so TypeScript narrows the type from "string | null" to "string"
  const sourceWalletId: string = tx.sourceWalletId;

  // 3. Atomic Database Refund Transaction with Row-Level Locking & Conditional Status Guard
  await db.$transaction(async (dbTx) => {
    // A. Lock the merchant wallet row and fetch live balance securely
    const wallets = await dbTx.$queryRaw<Array<{ balance: bigint }>>`
      SELECT balance FROM "Wallet" 
      WHERE id = ${merchantWalletId} 
      FOR UPDATE;
    `;

    const currentWallet = wallets[0];
    if (!currentWallet || currentWallet.balance < amount) {
      throw new Error("Insufficient wallet balance to issue refund.");
    }

    // B. Guard against double-refunds: Atomically update status ONLY if it's still SUCCESS
    const updateResult = await dbTx.transaction.updateMany({
      where: { 
        id: transactionId, 
        status: "SUCCESS" 
      },
      data: { 
        status: "REFUNDED" 
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Transaction has already been refunded or is no longer eligible.");
    }

    // C. Deduct from merchant wallet safely
    await dbTx.wallet.update({
      where: { id: merchantWalletId },
      data: { balance: { decrement: amount } },
    });

    // D. Refund back to customer's wallet safely
    await dbTx.wallet.update({
      where: { id: sourceWalletId },
      data: { balance: { increment: amount } },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}