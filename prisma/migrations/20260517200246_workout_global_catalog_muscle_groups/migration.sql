-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('BICEPS', 'TRICEPS', 'CHEST', 'LEGS', 'BACK', 'SHOULDERS', 'CARDIO');

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "muscleGroup" "MuscleGroup" NOT NULL DEFAULT 'CARDIO';

-- CreateTable
CREATE TABLE "WorkoutCatalogExercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutCatalogExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutCatalogExercise_muscleGroup_idx" ON "WorkoutCatalogExercise"("muscleGroup");

-- CreateIndex
CREATE INDEX "WorkoutCatalogExercise_name_idx" ON "WorkoutCatalogExercise"("name");

-- CreateIndex
CREATE INDEX "WorkoutCatalogExercise_createdById_idx" ON "WorkoutCatalogExercise"("createdById");

-- CreateIndex
CREATE INDEX "WorkoutExercise_muscleGroup_idx" ON "WorkoutExercise"("muscleGroup");

-- AddForeignKey
ALTER TABLE "WorkoutCatalogExercise" ADD CONSTRAINT "WorkoutCatalogExercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
