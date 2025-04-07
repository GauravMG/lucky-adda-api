/*
  Warnings:

  - You are about to drop the column `pPPUserBetUserBetId` on the `PPPWallet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PPPWallet" DROP CONSTRAINT "PPPWallet_pPPUserBetUserBetId_fkey";

-- AlterTable
ALTER TABLE "PPPWallet" DROP COLUMN "pPPUserBetUserBetId";
