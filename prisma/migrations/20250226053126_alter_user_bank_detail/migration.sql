/*
  Warnings:

  - The primary key for the `UserBankDetail` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accountId` on the `UserBankDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBankDetail" DROP CONSTRAINT "UserBankDetail_pkey",
DROP COLUMN "accountId",
ADD COLUMN     "userBankDetailId" SERIAL NOT NULL,
ADD CONSTRAINT "UserBankDetail_pkey" PRIMARY KEY ("userBankDetailId");
