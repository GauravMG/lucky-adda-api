-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "resultId" INTEGER;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "GameResult"("resultId") ON DELETE CASCADE ON UPDATE CASCADE;
