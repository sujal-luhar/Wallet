"use server";

import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";
import { revalidatePath } from "next/cache";

export async function handleSettleToBank(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rawAmount = formData.get("amount") as string;
  const idempotencyKey = formData.get("idempotencyKey") as string;

  if (!rawAmount || !idempotencyKey) {
    throw new Error("Invalid request parameters.");
  }

  const amountNumber = Number(rawAmount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid settlement amount.");
  }

  const amountCents = BigInt(Math.round(amountNumber * 100));

  // 1. Fetch merchant profile to get the wallet ID (no balance check here)
  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, Wallet: { select: { id: true } } },
  });

  if (!merchantProfile?.Wallet) throw new Error("Merchant wallet not found.");
  const walletId = merchantProfile.Wallet.id;

  // 2. Idempotency Check (Safe outside transaction because idempotencyKey has a unique constraint)
  const existingTx = await db.transaction.findUnique({
    where: { idempotencyKey },
  });

  if (existingTx) {
    return { success: true };
  }

  // 3. Atomic Database Transaction with Row-Level Locking (FOR UPDATE)
  let transactionId = "";
  await db.$transaction(async (tx) => {
    // Lock the wallet row and fetch the live balance atomically
    const wallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
      SELECT balance FROM "Wallet" 
      WHERE id = ${walletId} 
      FOR UPDATE;
    `;

    const currentWallet = wallets[0];

    // Validate balance securely while the row is locked
    if (!currentWallet || currentWallet.balance < amountCents) {
      throw new Error("Insufficient available balance for settlement.");
    }

    // Deduct from balance and move to locked balance safely
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

  // 4. Hit the existing Mock Bank payout route
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
  return { success: true, txId: transactionId };
}