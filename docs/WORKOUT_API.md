# Workout API — route → file map

The workout router is mounted in `src/app.js` at **`/api/workouts`** (`app.use('/api/workouts', workoutRoutes)`).

---

## Endpoints

| Method | Full path | Auth | Route file (registration) | Controller handler | Service function(s) | Body validation |
|--------|-----------|------|----------------------------|----------------------|----------------------|-----------------|
| **GET** | `/api/workouts/plan` | Public | `src/modules/workout/routes/workout.routes.js` (line 14) | `getWorkoutPlan` in `src/modules/workout/controller/workout.controller.js` | `getPublicPlan` in `src/modules/workout/service/workout.service.js` | — |
| **POST** | `/api/workouts/days` | `TRAINER` + Bearer | `workout.routes.js` (line 18) | `createDay` | `createDay` | `createDaySchema` in `src/modules/workout/validators/workout.schemas.js` |
| **PUT** | `/api/workouts/days/:dayId` | `TRAINER` + Bearer | `workout.routes.js` (line 19) | `updateDay` | `updateDay` | `updateDaySchema` in `workout.schemas.js` |
| **DELETE** | `/api/workouts/days/:dayId` | `TRAINER` + Bearer | `workout.routes.js` (line 20) | `deleteDay` | `deleteDay` | — |
| **POST** | `/api/workouts/days/:dayId/exercises` | `TRAINER` + Bearer | `workout.routes.js` (lines 22–27) | `createExercise` | `createExercise` | `createExerciseSchema` in `workout.schemas.js` |
| **PUT** | `/api/workouts/exercises/:exerciseId` | `TRAINER` + Bearer | `workout.routes.js` (lines 28–33) | `updateExercise` | `updateExercise` | `updateExerciseSchema` in `workout.schemas.js` |
| **DELETE** | `/api/workouts/exercises/:exerciseId` | `TRAINER` + Bearer | `workout.routes.js` (line 34) | `deleteExercise` | `deleteExercise` | — |

Trainer-only routes use middleware from `src/middleware/auth.js` (`auth`, `authorize('TRAINER')`), defined as `trainer` in `workout.routes.js` (line 16).

---

## Data layer

| Concern | File |
|--------|------|
| Prisma models (`WorkoutPlan`, `WorkoutDay`, `WorkoutExercise`) | `prisma/schema.prisma` |
| DB access (queries / CRUD) | `src/modules/workout/repository/workout.repository.js` |
| Initial plan + sample days/exercises | `prisma/seed.js` (run after migrations via `npx prisma db seed`) |

---

## Response shape

HTTP responses are built with `ApiResponse` from `src/utils/apiResponse.js` (used in the workout controller).

---

## Troubleshooting

| Response | Meaning |
|----------|---------|
| `Route not found: GET /api/workouts/plan` | Express did not match any route (often **stale Docker image**: rebuild with `docker compose build --no-cache app` then `docker compose up -d`). Or restart `npm run dev` after pulling code. |
| `Workout plan not found` (404 from app logic) | Route works; DB has no plan with slug `default`. Run `npx prisma migrate deploy`, `npx prisma generate`, `npx prisma db seed` against the same `DATABASE_URL` the app uses. |
