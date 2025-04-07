-- CreateTable
CREATE TABLE "PPPImage" (
    "imageId" SERIAL NOT NULL,
    "imageUrl" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,
    "userUserId" INTEGER,

    CONSTRAINT "PPPImage_pkey" PRIMARY KEY ("imageId")
);

-- CreateTable
CREATE TABLE "PPPSession" (
    "sessionId" SERIAL NOT NULL,
    "startTime" VARCHAR(100) NOT NULL,
    "endTime" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,
    "userUserId" INTEGER,

    CONSTRAINT "PPPSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "PPPUserBet" (
    "userBetId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "betAmount" VARCHAR(100) NOT NULL,
    "winningAmount" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,

    CONSTRAINT "PPPUserBet_pkey" PRIMARY KEY ("userBetId")
);

-- CreateTable
CREATE TABLE "PPPWallet" (
    "pppWalletId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'credit',
    "amount" DECIMAL(10,2) NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "approvalRemarks" TEXT,
    "userBetIds" TEXT,
    "sessionId" INTEGER,
    "imageUrl" TEXT,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,
    "userUserId" INTEGER,
    "pPPUserBetUserBetId" INTEGER,

    CONSTRAINT "PPPWallet_pkey" PRIMARY KEY ("pppWalletId")
);

-- AddForeignKey
ALTER TABLE "PPPImage" ADD CONSTRAINT "PPPImage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPImage" ADD CONSTRAINT "PPPImage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPImage" ADD CONSTRAINT "PPPImage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPImage" ADD CONSTRAINT "PPPImage_userUserId_fkey" FOREIGN KEY ("userUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPSession" ADD CONSTRAINT "PPPSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPSession" ADD CONSTRAINT "PPPSession_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPSession" ADD CONSTRAINT "PPPSession_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPSession" ADD CONSTRAINT "PPPSession_userUserId_fkey" FOREIGN KEY ("userUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PPPSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPUserBet" ADD CONSTRAINT "PPPUserBet_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "PPPImage"("imageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_userUserId_fkey" FOREIGN KEY ("userUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PPPWallet" ADD CONSTRAINT "PPPWallet_pPPUserBetUserBetId_fkey" FOREIGN KEY ("pPPUserBetUserBetId") REFERENCES "PPPUserBet"("userBetId") ON DELETE SET NULL ON UPDATE CASCADE;
