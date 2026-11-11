import { z } from "zod";

export const refundSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required."),
});

export type RefundInput = z.infer<typeof refundSchema>;