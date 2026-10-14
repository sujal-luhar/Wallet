"use server";

import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@wallet/auth";

export async function refundTransactionAction(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    include: { Wallet: true },
  });

  if (!merchantProfile?.Wallet) throw new Error("Merchant wallet not found");

  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { sourceWallet: true },
  });

  if (!tx || tx.destinationWalletId !== merchantProfile.Wallet.id) {
    throw new Error("Transaction not found or unauthorized.");
  }

  if (tx.status !== "SUCCESS") {
    throw new Error("Only successful transactions can be refunded.");
  }

  if (!tx.sourceWalletId) {
    throw new Error("Invalid source wallet for refund.");
  }

  const amount = tx.amount;

  if (merchantProfile.Wallet.balance < amount) {
    throw new Error("Insufficient wallet balance to issue refund.");
  }

  // Atomic database refund transaction
  await db.$transaction(async (dbTx) => {
    // 1. Deduct from merchant wallet
    await dbTx.wallet.update({
      where: { id: merchantProfile?.Wallet?.id },
      data: { balance: { decrement: amount } },
    });

    // 2. Refund back to customer's wallet
    await dbTx.wallet.update({
      where: { id: tx.sourceWalletId! },
      data: { balance: { increment: amount } },
    });

    // 3. Mark transaction status as REFUNDED
    await dbTx.transaction.update({
      where: { id: transactionId },
      data: { status: "REFUNDED" },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}