-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_destinationWalletId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_sourceWalletId_fkey";

-- DropIndex
DROP INDEX "Transaction_destinationWalletId_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_sourceWalletId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Transaction_sourceWalletId_createdAt_idx" ON "Transaction"("sourceWalletId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_destinationWalletId_createdAt_idx" ON "Transaction"("destinationWalletId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_destinationWalletId_status_createdAt_idx" ON "Transaction"("destinationWalletId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_sourceWalletId_status_createdAt_idx" ON "Transaction"("sourceWalletId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_destinationWalletId_type_status_createdAt_idx" ON "Transaction"("destinationWalletId", "type", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceWalletId_fkey" FOREIGN KEY ("sourceWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationWalletId_fkey" FOREIGN KEY ("destinationWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Wallet"
  ADD CONSTRAINT wallet_balance_non_negative CHECK (balance >= 0),
  ADD CONSTRAINT wallet_locked_non_negative  CHECK (locked >= 0),
  ADD CONSTRAINT wallet_exactly_one_owner
    CHECK (("userId" IS NULL) <> ("merchantId" IS NULL));

ALTER TABLE "Transaction"
  ADD CONSTRAINT tx_amount_non_negative CHECK (amount > 0),
  ADD CONSTRAINT tx_has_a_wallet
    CHECK ("sourceWalletId" IS NOT NULL OR "destinationWalletId" IS NOT NULL),
  ADD CONSTRAINT tx_no_self_transfer
    CHECK ("sourceWalletId" <> "destinationWalletId");