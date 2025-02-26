-- CreateTable
CREATE TABLE "AppSetting" (
    "appSettingId" SERIAL NOT NULL,
    "isAppShutdown" BOOLEAN NOT NULL DEFAULT false,
    "appShutDownMessage" TEXT NOT NULL DEFAULT 'This app is currently unavailable',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "deletedById" INTEGER,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("appSettingId")
);

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
