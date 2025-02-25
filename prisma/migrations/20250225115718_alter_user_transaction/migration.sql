-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "referenceWalletId" INTEGER;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_referenceWalletId_fkey" FOREIGN KEY ("referenceWalletId") REFERENCES "Wallet"("walletId") ON DELETE CASCADE ON UPDATE CASCADE;
