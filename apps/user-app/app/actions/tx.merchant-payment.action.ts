"use server";

import { db, Prisma } from "@wallet/db";
import {
  resolveWalletAndAuth,
  checkIdempotency,
} from "@wallet/auth/actions/tx.action-guard";
import {
  safeAction,
  merchantPaymentSchema,
  MerchantPaymentInput,
  TxActionResponse,
  AppError,
} from "@wallet/common";

async function executeMerchantPayment({
  merchantId,
  amount,
  idempotencyKey,
}: MerchantPaymentInput): Promise<TxActionResponse> {
  const { walletId: senderWalletId } = await resolveWalletAndAuth(false);
  const amountPaise = BigInt(Math.round(amount * 100));

  // Find Merchant Wallet
  // Search MerchantProfile by ID, or by the User's phone linked to the profile
  const merchantProfile = await db.merchantProfile.findFirst({
    where: {
      OR: [{ id: merchantId }, { user: { phone: merchantId } }],
    },
    include: { Wallet: true },
  });

  if (!merchantProfile || !merchantProfile.Wallet) {
    throw new AppError("Merchant profile not found.");
  }

  const destinationWallet = merchantProfile.Wallet;

  if (destinationWallet.id === senderWalletId) {
    throw new AppError(
      "You cannot pay your own merchant wallet from your user wallet.",
    );
  }

  const resume = (tx: NonNullable<Awaited<ReturnType<typeof checkIdempotency>>>) => {
    // Same key must mean same intent, and must belong to this wallet.
    const sameIntent =
      tx.type === "MERCHANT_PAYMENT" &&
      tx.sourceWalletId === senderWalletId &&
      tx.destinationWalletId === destinationWallet.id &&
      tx.amount === amountPaise;

    // Deliberately generic: don't reveal that the key exists for someone else.
    if (!sameIntent) throw new AppError("Invalid request. Please start a new payment.");

    if (tx.status === "SUCCESS" || tx.status === "PENDING") {
      return { success: true as const, id: tx.id };
    }

    throw new AppError(
      "This payment attempt has already concluded. Please start a new payment.",
    );
  };

  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return resume(existing);

  try {
    // Atomic Prisma Transaction
    const transaction = await db.$transaction(async (tx) => {
      // 1. Lock and fetch sender wallet using raw SQL FOR UPDATE
      const senderWallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
        SELECT balance FROM "Wallet" 
        WHERE id = ${senderWalletId} 
        FOR UPDATE;
      `;

      const currentSenderWallet = senderWallets[0];

      if (!currentSenderWallet || currentSenderWallet.balance < amountPaise) {
        throw new AppError("Insufficient wallet balance.");
      }

      // 2. Deduct from Sender User Wallet
      await tx.wallet.update({
        where: { id: senderWalletId },
        data: {
          balance: { decrement: amountPaise },
        },
      });

      // 3. Credit to Recipient Merchant Wallet
      await tx.wallet.update({
        where: { id: destinationWallet.id },
        data: {
          balance: { increment: amountPaise },
        },
      });

      // 4. Create Transaction Record
      return await tx.transaction.create({
        data: {
          amount: amountPaise,
          type: "MERCHANT_PAYMENT",
          status: "SUCCESS",
          idempotencyKey,
          sourceWalletId: senderWalletId,
          destinationWalletId: destinationWallet.id,
        },
        select: { id: true },
      });
    });

    return { success: true, id: transaction.id };
  } catch (e) {
    // Lost the race against a concurrent request with the same key.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await checkIdempotency(idempotencyKey);
      if (winner) return resume(winner);
    }
    throw e;
  }
}

export const initMerchantPaymentAction = safeAction(
  merchantPaymentSchema,
  executeMerchantPayment,
);
