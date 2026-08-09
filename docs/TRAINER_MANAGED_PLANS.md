# Trainer Managed Workout And Nutrition Plans

## What changed

Workout and nutrition plan access is now tied to the trainer assigned to the player.

- Player plan reads require `Authorization: Bearer <token>`.
- A player must have an active `TrainerAssignment` before accessing workout or nutrition plan data.
- If the player is waiting for coach approval, plan endpoints return `403` with:
  - `Your trainer request is waiting for coach approval. You cannot access this plan yet.`
- If the last request was rejected, plan endpoints return `403` with:
  - `Your trainer request was rejected. You can send a request to a coach again.`
- If the player has no assignment or request, plan endpoints return `403` with:
  - `You are not assigned to a trainer yet. Send a request to a coach to access this plan.`
- Trainers can create and manage plans only for players actively assigned to them.
- Rejected or cancelled trainer requests no longer block future requests to the same coach.
- Trainers can reuse already-created workout exercises and nutrition meals from dedicated catalogs.
- If a trainer does not find an exercise or meal in the reusable list, they can still create a new one inside a player plan.

## Database changes

Migration added:

```text
prisma/migrations/20260427000000_trainer_managed_plans/migration.sql
```

Schema changes:

- `WorkoutPlan` now has optional `playerId` and `trainerId`.
- `NutritionMeal` now represents player-assigned meals only.
- `NutritionCatalogMeal` stores reusable meal templates for all trainers.
- `User` now has relations for player/trainer workout plans and nutrition meals.
- `TrainerRequest` no longer has a unique constraint on `(playerId, trainerId, status)`.
- A normal index on `(playerId, trainerId, status)` remains for lookup performance.

## Endpoint changes

### Player endpoints

These require a user token and an active trainer assignment:

```http
GET /api/workouts/plan
GET /api/nutrition/meals
GET /api/nutrition/meals/:mealId
```

Nutrition still supports section filtering:

```http
GET /api/nutrition/meals?section=breakfast
```

### Trainer endpoints

These require a trainer token. The trainer must be actively assigned to `:playerId`.

```http
GET  /api/workouts/catalog/exercises
GET  /api/workouts/players/:playerId/plan
POST /api/workouts/players/:playerId/days
PUT  /api/workouts/days/:dayId
DELETE /api/workouts/days/:dayId
POST /api/workouts/days/:dayId/exercises
POST /api/workouts/days/:dayId/exercises/from-catalog
PUT  /api/workouts/exercises/:exerciseId
DELETE /api/workouts/exercises/:exerciseId

GET  /api/nutrition/players/:playerId/meals
GET  /api/nutrition/catalog/meals
POST /api/nutrition/players/:playerId/meals
POST /api/nutrition/players/:playerId/meals/from-catalog
PUT  /api/nutrition/meals/:mealId
DELETE /api/nutrition/meals/:mealId
```

Workout flow:

- Use `POST /api/workouts/players/:playerId/days` to create a new empty day if no existing day matches.
- Use `GET /api/workouts/catalog/exercises` to choose an already-created exercise.
- Use `POST /api/workouts/days/:dayId/exercises/from-catalog` with `sourceExerciseId` to copy that exercise into a player's existing day.
- Use `POST /api/workouts/days/:dayId/exercises` to create a new exercise directly inside a player day.

Nutrition flow:

- Use `GET /api/nutrition/catalog/meals` to choose an already-created meal.
- Use `POST /api/nutrition/players/:playerId/meals/from-catalog` to copy that meal into the player's plan.
- Use `POST /api/nutrition/players/:playerId/meals` to create a new meal directly inside a player plan.
- Creating a new meal inside a player plan also inserts a reusable catalog copy.

Add exercise from catalog body:

```json
{
  "sourceExerciseId": "uuid",
  "sortOrder": 2
}
```

`sortOrder` is optional. If omitted, the copied exercise keeps the source exercise order.

Add meal from catalog body:

```json
{
  "sourceCatalogMealId": "uuid"
}
```

`sourceMealId` is also accepted for backward compatibility.

### Trainer request endpoints

These are now registered under `/api/subscriptions`:

```http
POST /api/subscriptions/trainer-requests
GET  /api/subscriptions/trainer-requests/me
POST /api/subscriptions/trainer-requests/:requestId/cancel
GET  /api/subscriptions/trainer-requests/inbox
POST /api/subscriptions/trainer-requests/:requestId/approve
POST /api/subscriptions/trainer-requests/:requestId/reject
GET  /api/subscriptions/assignment/me
```

## Docker migration commands

Start Postgres:

```powershell
docker compose up -d postgres
```

Rebuild and start the app so the container has the new migration files:

```powershell
docker compose build app
docker compose up -d app
```

Apply migrations from inside the app container:

```powershell
docker compose exec app npx prisma migrate deploy
```

Regenerate Prisma Client inside the app container if needed:

```powershell
docker compose exec app npx prisma generate
```

For local development against the Docker Postgres database, you can also run:

```powershell
docker compose up -d postgres
npx prisma migrate deploy
npx prisma generate
```

## Verification done

```powershell
npx prisma generate
npx prisma validate
node -e "require('./src/app'); console.log('app loaded')"
node --check src\modules\workout\service\workout.service.js
node --check src\modules\nutrition\service\nutrition.service.js
node --check src\modules\subscription\routes\subscription.routes.js
```
