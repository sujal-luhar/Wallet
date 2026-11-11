"use server";

import { db } from "@wallet/db";
import { resolveWalletAndAuth, checkIdempotency } from "@wallet/auth/actions/tx.action-guard";
import { safeAction, merchantPaymentSchema, MerchantPaymentInput, TxActionResponse } from "@wallet/common";

async function executeMerchantPayment({
  merchantId,
  amount,
  idempotencyKey,
}: MerchantPaymentInput): Promise<TxActionResponse> {
  const amountInPaise = BigInt(amount * 100);
  const { walletId: senderWalletId } = await resolveWalletAndAuth(false);

  // 1. Idempotency Check
  const existingTx = await checkIdempotency(idempotencyKey);
  if (existingTx) {
    return { success: true, id: existingTx.id };
  }

  // 2. Find Merchant Wallet
  // Search MerchantProfile by ID, or by the User's phone linked to the profile
  const merchantProfile = await db.merchantProfile.findFirst({
    where: {
      OR: [{ id: merchantId }, { user: { phone: merchantId } }],
    },
    include: { Wallet: true },
  });

  if (!merchantProfile || !merchantProfile.Wallet) {
    throw new Error("Merchant profile not found.");
  }

  const destinationWallet = merchantProfile.Wallet;

  if (destinationWallet.id === senderWalletId) {
    throw new Error(
      "You cannot pay your own merchant wallet from your user wallet.",
    );
  }

  // 3. Atomic Prisma Transaction
  const transaction = await db.$transaction(async (tx) => {
    // 1. Lock and fetch sender wallet using raw SQL FOR UPDATE
    const senderWallets = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM "Wallet" 
    WHERE id = ${senderWalletId} 
    FOR UPDATE;
  `;

    const currentSenderWallet = senderWallets[0];

    if (!currentSenderWallet || currentSenderWallet.balance < amountInPaise) {
      throw new Error("Insufficient wallet balance.");
    }

    // 2. Deduct from Sender User Wallet
    await tx.wallet.update({
      where: { id: senderWalletId },
      data: {
        balance: { decrement: amountInPaise },
      },
    });

    // 3. Credit to Recipient Merchant Wallet
    await tx.wallet.update({
      where: { id: destinationWallet.id },
      data: {
        balance: { increment: amountInPaise },
      },
    });

    // 4. Create Transaction Record
    return await tx.transaction.create({
      data: {
        amount: amountInPaise,
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
}

export const initMerchantPaymentAction = safeAction(merchantPaymentSchema, executeMerchantPayment);