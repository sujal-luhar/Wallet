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

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    include: { Wallet: true },
  });

  if (!merchantProfile?.Wallet) throw new Error("Merchant wallet not found.");

  const wallet = merchantProfile.Wallet;

  // 1. Idempotency Check
  const existingTx = await db.transaction.findUnique({
    where: { idempotencyKey },
  });

  if (existingTx) {
    return { success: true };
  }

  if (wallet.balance < amountCents) {
    throw new Error("Insufficient available balance for settlement.");
  }

  // 2. Atomic Database Transaction (Lock funds & create transaction)
  let transactionId = "";
  await db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
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
        sourceWalletId: wallet.id,
        destinationWalletId: null,
        idempotencyKey,
      },
    });

    transactionId = newTx.id;
  });

  // 3. Hit the existing Mock Bank payout route
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
