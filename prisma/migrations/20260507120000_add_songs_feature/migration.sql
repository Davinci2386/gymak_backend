-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "mp3Url" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE INDEX "Song_artist_idx" ON "Song"("artist");

-- CreateIndex
CREATE INDEX "Song_createdAt_idx" ON "Song"("createdAt");

-- CreateIndex
CREATE INDEX "Song_createdByAdminId_idx" ON "Song"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
