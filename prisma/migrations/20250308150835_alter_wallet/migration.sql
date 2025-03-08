-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "gameId" INTEGER,
ADD COLUMN     "userBetIds" TEXT;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("gameId") ON DELETE CASCADE ON UPDATE CASCADE;
