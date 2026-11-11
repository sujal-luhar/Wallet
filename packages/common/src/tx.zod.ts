import { z } from "zod";

export const refundSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required."),
});

export const settleToBankSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero."),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
});

export const depositSchema = z.object({
  amount: z.number().min(100, "Minimum deposit amount is ₹100."),
  paymentMethod: z.string().optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
});

export const withdrawSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal amount is ₹100."),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
});

export const merchantPaymentSchema = z.object({
  merchantId: z.string().min(1, "Merchant identifier is required."),
  amount: z.number().min(1, "Minimum payment amount is ₹1."),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
});

export const p2pTransferSchema = z.object({
  recipientPhone: z.string().min(1, "Recipient phone is required."),
  amount: z.number().min(1, "Minimum transfer amount is ₹1."),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
});



export type RefundInput = z.infer<typeof refundSchema>;
export type SettleToBankInput = z.infer<typeof settleToBankSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type MerchantPaymentInput = z.infer<typeof merchantPaymentSchema>;
export type P2PTransferInput = z.infer<typeof p2pTransferSchema>;