CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS', 'WEB', 'UNKNOWN');

CREATE TYPE "NotificationTargetType" AS ENUM ('USER', 'TRAINER', 'BROADCAST');

CREATE TYPE "NotificationLogStatus" AS ENUM ('SENT', 'PARTIAL', 'FAILED');

CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL DEFAULT 'UNKNOWN',
    "deviceName" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "createdByAdminId" TEXT,
    "targetType" "NotificationTargetType" NOT NULL,
    "targetUserId" TEXT,
    "audienceRole" "Role",
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "NotificationLogStatus" NOT NULL DEFAULT 'SENT',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX "DeviceToken_platform_idx" ON "DeviceToken"("platform");
CREATE INDEX "DeviceToken_lastSeenAt_idx" ON "DeviceToken"("lastSeenAt");

CREATE INDEX "NotificationLog_createdByAdminId_idx" ON "NotificationLog"("createdByAdminId");
CREATE INDEX "NotificationLog_targetType_idx" ON "NotificationLog"("targetType");
CREATE INDEX "NotificationLog_targetUserId_idx" ON "NotificationLog"("targetUserId");
CREATE INDEX "NotificationLog_audienceRole_idx" ON "NotificationLog"("audienceRole");
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

ALTER TABLE "DeviceToken"
ADD CONSTRAINT "DeviceToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
