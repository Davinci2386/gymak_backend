-- CreateEnum
CREATE TYPE "MealSection" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateTable
CREATE TABLE "NutritionMeal" (
    "id" TEXT NOT NULL,
    "section" "MealSection" NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionIngredient" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NutritionIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionMeal_section_idx" ON "NutritionMeal"("section");

-- CreateIndex
CREATE INDEX "NutritionIngredient_mealId_idx" ON "NutritionIngredient"("mealId");

-- AddForeignKey
ALTER TABLE "NutritionIngredient" ADD CONSTRAINT "NutritionIngredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "NutritionMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
