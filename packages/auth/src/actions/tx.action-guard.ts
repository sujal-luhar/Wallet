import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../index";

// 1. Resolves wallet ID for standard users or merchants
export async function resolveWalletAndAuth(isMerchant = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized.");
  }

  if (isMerchant) {
    const merchantProfile = await db.merchantProfile.findUnique({
      where: { userId: session.user.id },
      select: { Wallet: { select: { id: true } } },
    });
    if (!merchantProfile?.Wallet) throw new Error("Merchant wallet not found.");
    return { userId: session.user.id, walletId: merchantProfile.Wallet.id };
  } else {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { Wallet: true },
    });
    if (!user?.Wallet) throw new Error("User wallet not found.");
    return { userId: session.user.id, walletId: user.Wallet.id };
  }
}

// 2. Shared Idempotency Lookups
export async function checkIdempotency(idempotencyKey?: string) {
  if (!idempotencyKey) return null;
  const existingTx = await db.transaction.findUnique({
    where: { idempotencyKey },
    select: { id: true, status: true },
  });
  return existingTx;
}

// 3. Shared Refund Validation Guard (Specific to tx.refund.action.ts)
export async function assertValidRefundTarget(transactionId: string, merchantWalletId: string) {
  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      amount: true,
      status: true,
      destinationWalletId: true,
      sourceWalletId: true,
    },
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

  return {
    amount: tx.amount,
    sourceWalletId: tx.sourceWalletId,
  };
}