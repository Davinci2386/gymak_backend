-- Add a dedicated nutrition catalog so assigned player meals are separated
-- from reusable meal templates, mirroring the workout catalog pattern.

CREATE TABLE "NutritionCatalogMeal" (
    "id" TEXT NOT NULL,
    "section" "MealSection" NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionCatalogMeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NutritionCatalogIngredient" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NutritionCatalogIngredient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NutritionCatalogMeal_section_idx" ON "NutritionCatalogMeal"("section");
CREATE INDEX "NutritionCatalogMeal_name_idx" ON "NutritionCatalogMeal"("name");
CREATE INDEX "NutritionCatalogMeal_createdById_idx" ON "NutritionCatalogMeal"("createdById");
CREATE INDEX "NutritionCatalogIngredient_mealId_idx" ON "NutritionCatalogIngredient"("mealId");

ALTER TABLE "NutritionCatalogMeal"
ADD CONSTRAINT "NutritionCatalogMeal_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NutritionCatalogIngredient"
ADD CONSTRAINT "NutritionCatalogIngredient_mealId_fkey"
FOREIGN KEY ("mealId") REFERENCES "NutritionCatalogMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Move any old global nutrition meals into the dedicated catalog.
INSERT INTO "NutritionCatalogMeal" ("id", "section", "name", "imageUrl", "calories", "createdAt", "updatedAt")
SELECT "id", "section", "name", "imageUrl", "calories", "createdAt", "updatedAt"
FROM "NutritionMeal"
WHERE "playerId" IS NULL AND "trainerId" IS NULL;

INSERT INTO "NutritionCatalogIngredient" ("id", "mealId", "name", "quantity", "calories", "sortOrder")
SELECT ni."id", ni."mealId", ni."name", ni."quantity", ni."calories", ni."sortOrder"
FROM "NutritionIngredient" ni
JOIN "NutritionMeal" nm ON nm."id" = ni."mealId"
WHERE nm."playerId" IS NULL AND nm."trainerId" IS NULL;

DELETE FROM "NutritionIngredient"
WHERE "mealId" IN (
  SELECT "id"
  FROM "NutritionMeal"
  WHERE "playerId" IS NULL AND "trainerId" IS NULL
);

DELETE FROM "NutritionMeal"
WHERE "playerId" IS NULL AND "trainerId" IS NULL;
