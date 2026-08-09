# Nutrition feature

This module now follows the same separation used in workouts:

- `NutritionCatalogMeal` is the reusable meal catalog shared across trainers.
- `NutritionMeal` is the meal assigned inside a specific player plan, scoped by `playerId` and `trainerId`.

## Domain model

- `NutritionCatalogMeal`
  - General meal template.
  - Stores `section`, `name`, `imageUrl`, `calories`, optional `createdById`.
  - Has many `NutritionCatalogIngredient`.
- `NutritionMeal`
  - Player-specific assigned meal.
  - Stores the same meal data plus `playerId` and `trainerId`.
  - Has many `NutritionIngredient`.

This keeps the catalog reusable while allowing coaches to build private player plans.

## API (`/api/nutrition`)

### Player endpoints

These require `USER` auth and an active trainer assignment.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/nutrition/meals` | Get the assigned nutrition plan for the current player. |
| `GET` | `/api/nutrition/meals/:mealId` | Get one assigned meal from the current player plan. |

Optional filter:

```http
GET /api/nutrition/meals?section=breakfast
```

### Trainer endpoints

These require `TRAINER` auth.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/nutrition/catalog/meals` | List reusable catalog meals. |
| `GET` | `/api/nutrition/players/:playerId/meals` | View one player's assigned meals. |
| `POST` | `/api/nutrition/players/:playerId/meals` | Create a new custom meal for a player and also add it to the catalog. |
| `POST` | `/api/nutrition/players/:playerId/meals/from-catalog` | Copy an existing catalog meal into the player's plan. |
| `PUT` | `/api/nutrition/meals/:mealId` | Update a player-assigned meal only. |
| `DELETE` | `/api/nutrition/meals/:mealId` | Delete a player-assigned meal only. |

Catalog filtering:

```http
GET /api/nutrition/catalog/meals?section=lunch
```

Create custom meal body:

```json
{
  "section": "LUNCH",
  "name": "Grilled chicken salad",
  "imageUrl": "https://example.com/meal.jpg",
  "calories": 480,
  "ingredients": [
    { "name": "Chicken breast", "quantity": "150g", "calories": 230 },
    { "name": "Mixed greens", "quantity": "100g", "calories": 25 }
  ]
}
```

Add from catalog body:

```json
{
  "sourceCatalogMealId": "uuid"
}
```

Backward-compatible alias:

```json
{
  "sourceMealId": "uuid"
}
```

## Behavior

- Player meal reads return only meals assigned to that player by the currently active trainer.
- Creating a custom meal for a player also inserts a reusable copy into `NutritionCatalogMeal`.
- Copying from catalog creates a new `NutritionMeal` row for that player; it does not reuse the catalog row directly.
- Updating or deleting an assigned meal does not mutate the catalog copy, matching the workout behavior.

## Seed data

- `prisma/nutritionSeedData.js` contains the starter meal catalog.
- `prisma/seed.js` now seeds `NutritionCatalogMeal`, not player-assigned meals.

## Important migration note

The migration `prisma/migrations/20260604000000_nutrition_catalog_alignment/migration.sql`:

- creates the new nutrition catalog tables
- moves old global meals (`playerId IS NULL` and `trainerId IS NULL`) from `NutritionMeal` into the catalog
- deletes those old global rows from `NutritionMeal`

## Code layout

| Area | Path |
|------|------|
| Routes | `src/modules/nutrition/routes/nutrition.routes.js` |
| Controller | `src/modules/nutrition/controller/nutrition.controller.js` |
| Service | `src/modules/nutrition/service/nutrition.service.js` |
| Repository | `src/modules/nutrition/repository/nutrition.repository.js` |
| Validators | `src/modules/nutrition/validators/nutrition.schemas.js` |
| Section mapping | `src/modules/nutrition/constants/sections.js` |
