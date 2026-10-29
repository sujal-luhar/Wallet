/*
  Warnings:

  - You are about to drop the column `originalTransactionId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_originalTransactionId_fkey";

-- DropIndex
DROP INDEX "Transaction_originalTransactionId_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "originalTransactionId";
