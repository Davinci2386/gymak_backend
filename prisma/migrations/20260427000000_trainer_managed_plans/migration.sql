-- Allow players to send new requests after previous requests were rejected or cancelled.
DROP INDEX IF EXISTS "TrainerRequest_playerId_trainerId_status_key";
CREATE INDEX IF NOT EXISTS "TrainerRequest_playerId_trainerId_status_idx" ON "TrainerRequest"("playerId", "trainerId", "status");

-- Scope workout plans to the player and assigned trainer that manage them.
ALTER TABLE "WorkoutPlan" ADD COLUMN "playerId" TEXT;
ALTER TABLE "WorkoutPlan" ADD COLUMN "trainerId" TEXT;

CREATE UNIQUE INDEX "WorkoutPlan_playerId_trainerId_key" ON "WorkoutPlan"("playerId", "trainerId");
CREATE INDEX "WorkoutPlan_playerId_idx" ON "WorkoutPlan"("playerId");
CREATE INDEX "WorkoutPlan_trainerId_idx" ON "WorkoutPlan"("trainerId");

ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Scope nutrition meals to the player and assigned trainer that manage them.
ALTER TABLE "NutritionMeal" ADD COLUMN "playerId" TEXT;
ALTER TABLE "NutritionMeal" ADD COLUMN "trainerId" TEXT;

CREATE INDEX "NutritionMeal_playerId_idx" ON "NutritionMeal"("playerId");
CREATE INDEX "NutritionMeal_trainerId_idx" ON "NutritionMeal"("trainerId");

ALTER TABLE "NutritionMeal" ADD CONSTRAINT "NutritionMeal_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NutritionMeal" ADD CONSTRAINT "NutritionMeal_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
