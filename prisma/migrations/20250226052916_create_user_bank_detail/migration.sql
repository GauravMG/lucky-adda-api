-- CreateTable
CREATE TABLE "UserBankDetail" (
    "accountId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "ifscCode" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,

    CONSTRAINT "UserBankDetail_pkey" PRIMARY KEY ("accountId")
);

-- AddForeignKey
ALTER TABLE "UserBankDetail" ADD CONSTRAINT "UserBankDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBankDetail" ADD CONSTRAINT "UserBankDetail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBankDetail" ADD CONSTRAINT "UserBankDetail_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBankDetail" ADD CONSTRAINT "UserBankDetail_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
