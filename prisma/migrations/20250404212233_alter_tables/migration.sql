/*
  Warnings:

  - You are about to drop the column `userUserId` on the `PPPWallet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PPPWallet" DROP CONSTRAINT "PPPWallet_userUserId_fkey";

-- AlterTable
ALTER TABLE "PPPUserBet" ADD COLUMN     "betStatus" "BetStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "PPPWallet" DROP COLUMN "userUserId";

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PPPSession"("sessionId") ON DELETE SET NULL ON UPDATE CASCADE;
