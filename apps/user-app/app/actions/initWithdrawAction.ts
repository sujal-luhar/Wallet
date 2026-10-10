"use server";

import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

interface WithdrawalInput {
  amount: number; // Amount in Rupees from client UI
  idempotencyKey: string;
}

export async function initiateWithdrawalAction({ amount, idempotencyKey }: WithdrawalInput) {
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
    if (existingTx.status === "PENDING") {
      return { id: existingTx.id };
    }
    throw new Error("This transaction has already concluded.");
  }

  // 3. Atomic Database Operation: Check balance + Deduct funds + Log PENDING Tx
  const transaction = await db.$transaction(async (tx) => {
    // Lock wallet row & check balance
    const currentWallet = await tx.wallet.findUnique({
      where: { id: wallet.id },
      select: { balance: true },
    });

    if (!currentWallet || currentWallet.balance < amountInPaise) {
      throw new Error("Insufficient wallet balance.");
    }

    // Deduct balance immediately
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amountInPaise },
      },
    });

    // Create PENDING withdrawal record
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
  const bankBaseUrl = process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";

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
    // Note: The transaction remains PENDING and can be picked up by a cron/reconciliation job
  }

  return { id: transaction.id };
}