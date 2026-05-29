-- CreateTable
CREATE TABLE "UserProfileImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfileImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProfileImage_userId_idx" ON "UserProfileImage"("userId");

-- AddForeignKey
ALTER TABLE "UserProfileImage" ADD CONSTRAINT "UserProfileImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
