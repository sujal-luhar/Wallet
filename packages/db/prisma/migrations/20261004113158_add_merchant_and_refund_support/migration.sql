/*
  Warnings:

  - A unique constraint covering the columns `[originalTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TxnStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "TxnType" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "originalTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_originalTransactionId_key" ON "Transaction"("originalTransactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
