-- AlterTable
ALTER TABLE "User" ADD COLUMN     "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasRoutine" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainTime" TEXT;
