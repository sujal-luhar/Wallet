"use server";

import { getWalletBalance } from "@/dal/getbalance";
import { db } from "@wallet/db";

interface WithdrawalInput {
  amount: number; // Amount in Rupees from client UI
  idempotencyKey: string;
}

export async function initiateWithdrawalAction({
  amount,
  idempotencyKey,
}: WithdrawalInput) {
  if (!amount || amount < 100) {
    throw new Error("Minimum withdrawal amount is ₹100.");
  }

  const amountInPaise = amount * 100;
  const wallet = await getWalletBalance();

  if (!wallet?.id) {
    throw new Error("Unauthorized access.");
  }

  const existingTx = await db.transaction.findUnique({
    where: { idempotencyKey },
    select: { id: true, status: true },
  });

  if (existingTx) {
    if (existingTx.status === "PENDING" || existingTx.status === "PROCESSING") {
      return { id: existingTx.id };
    }
    throw new Error("This transaction has already concluded.");
  }

  // 3. Atomic Database Operation: Check balance + Deduct balance + Increment locked + Log PENDING Tx
  const transaction = await db.$transaction(async (tx) => {
    // 1. Lock wallet row & check balance atomically using raw SQL FOR UPDATE
    const wallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM "Wallet" 
    WHERE id = ${wallet.id} 
    FOR UPDATE;
  `;

    const currentWallet = wallets[0];

    if (!currentWallet || currentWallet.balance < BigInt(amountInPaise)) {
      throw new Error("Insufficient wallet balance.");
    }

    // 2. Deduct from balance and move to locked balance
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amountInPaise },
        locked: { increment: amountInPaise }, // Track pending withdrawal safely
      },
    });

    // 3. Create PENDING withdrawal record
    return await tx.transaction.create({
      data: {
        amount: amountInPaise,
        type: "WITHDRAWAL",
        status: "PENDING",
        idempotencyKey,
        sourceWalletId: wallet.id,
        destinationWalletId: null,
      },
      select: { id: true },
    });
  });

  // 4. Trigger Server-to-Server Payout Call to Express Mock Bank
  const bankBaseUrl =
    process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";

  try {
    await fetch(`${bankBaseUrl}/mock-bank/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txId: transaction.id,
        amount: amountInPaise,
        destinationAccount: "HDFC_••••_4092",
      }),
    });
  } catch (err) {
    console.error("Failed to notify mock bank:", err);
  }

  return { id: transaction.id };
}
