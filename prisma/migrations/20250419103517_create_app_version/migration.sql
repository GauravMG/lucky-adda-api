-- AlterTable
ALTER TABLE "LoginHistory" ADD COLUMN     "versionNumber" TEXT DEFAULT '1.0.0';

-- CreateTable
CREATE TABLE "AppVersion" (
    "appVersionId" SERIAL NOT NULL,
    "deviceType" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("appVersionId")
);

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
