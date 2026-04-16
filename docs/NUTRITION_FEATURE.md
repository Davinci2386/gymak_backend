# Nutrition feature — summary

This document describes the nutrition module added to the workout backend: data model, public catalog API, trainer (coach) write API, seed data, and where the code lives.

---

## Domain model (Prisma)

- **`MealSection` enum:** `BREAKFAST`, `LUNCH`, `DINNER` — the three meal sections (breakfast, lunch, dinner).
- **`NutritionMeal`:** belongs to one section; stores `name`, `imageUrl` (single image per meal), total `calories`, and related ingredients.
- **`NutritionIngredient`:** belongs to a meal; stores `name`, `quantity` (free-text, e.g. `200g`, `1 tbsp`), per-ingredient `calories`, and `sortOrder` for stable ordering.

Deleting a meal cascades to its ingredients. Migration: `prisma/migrations/20260416120000_nutrition_meals/migration.sql`.

---

## API (`/api/nutrition`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| **GET** | `/api/nutrition/meals` | Public | Full catalog: response groups meals under `sections.breakfast`, `sections.lunch`, `sections.dinner`. Optional query: `?section=breakfast` \| `lunch` \| `dinner` returns `{ meals: [...] }` for that section only. |
| **GET** | `/api/nutrition/meals/:mealId` | Public | Single meal with ingredients. |
| **POST** | `/api/nutrition/meals` | `TRAINER` + Bearer | Create a meal in a chosen section; body includes ingredients array. |
| **PUT** | `/api/nutrition/meals/:mealId` | `TRAINER` + Bearer | Partial update; if `ingredients` is sent, ingredients are replaced (delete + recreate). |
| **DELETE** | `/api/nutrition/meals/:mealId` | `TRAINER` + Bearer | Remove a meal and its ingredients. |

JSON responses follow the existing `ApiResponse` shape (`success`, `statusCode`, `message`, `data`). Public meal payloads expose `section` as lowercase keys: `breakfast`, `lunch`, `dinner` (mapped from Prisma enums for readability).

**Create meal body (example):**

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

---

## Code layout

| Area | Path |
|------|------|
| Routes | `src/modules/nutrition/routes/nutrition.routes.js` |
| Controller | `src/modules/nutrition/controller/nutrition.controller.js` |
| Service (mapping + rules) | `src/modules/nutrition/service/nutrition.service.js` |
| Repository (Prisma) | `src/modules/nutrition/repository/nutrition.repository.js` |
| Joi validators | `src/modules/nutrition/validators/nutrition.schemas.js` |
| Section query / API key mapping | `src/modules/nutrition/constants/sections.js` |
| Router mount | `src/app.js` — `app.use('/api/nutrition', nutritionRoutes)` |

---

## Seed data

- **`prisma/nutritionSeedData.js`** — six sample meals (two per section) with realistic-style ingredients and Unsplash image URLs.
- **`prisma/seed.js`** — runs workout seed first, then nutrition seed. Nutrition insert is skipped if any `NutritionMeal` row already exists.

After migrations, run:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

---

## Notes

- “Coach” in product terms maps to the existing **`TRAINER`** role and JWT (`authorize('TRAINER')`).
- Meal `calories` is stored explicitly (not auto-summed from ingredients) so totals can match labels or rounding used by coaches.
