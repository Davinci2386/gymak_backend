# Trainer Catalog And Media Upload API

## Overview

This update adds direct trainer catalog creation and switches create-image flows from URL strings to file uploads.

What changed:

- Trainers can now create workout catalog exercises directly.
- Trainers can now create nutrition catalog meals directly.
- Exercise images are now uploaded as files using `multipart/form-data`.
- Meal images are now uploaded as files using `multipart/form-data`.
- `videoUrl` for exercises remains a normal text URL.
- When a trainer creates a player exercise or player meal, the backend still creates a reusable catalog copy automatically.
- This document covers the create flows changed in this update. Update endpoints were not changed here.

Image storage:

- Uploaded images are stored through ImageKit.
- The database still stores the generated public URL(s).

## Auth

All endpoints in this file require:

- `Authorization: Bearer <trainer_access_token>`

## Exercise APIs

### 1. Create catalog exercise directly

- Method: `POST`
- URL: `/api/workouts/catalog/exercises`
- Content-Type: `multipart/form-data`
- Role: `TRAINER`

Form-data fields:

- `name` required, string
- `description` optional, string
- `videoUrl` optional, string URL
- `muscleGroup` required, one of:
  - `BICEPS`
  - `TRICEPS`
  - `CHEST`
  - `LEGS`
  - `BACK`
  - `SHOULDERS`
  - `CARDIO`
- `images` optional, multiple image files

Example cURL:

```bash
curl -X POST "http://localhost:3000/api/workouts/catalog/exercises" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=Barbell Bench Press" \
  -F "description=Compound chest exercise targeting the pectorals." \
  -F "videoUrl=https://example.com/videos/bench-press.mp4" \
  -F "muscleGroup=CHEST" \
  -F "images=@C:/files/bench-1.jpg" \
  -F "images=@C:/files/bench-2.jpg"
```

Success response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Catalog exercise created",
  "data": {
    "exercise": {
      "id": "exercise-catalog-uuid",
      "name": "Barbell Bench Press",
      "description": "Compound chest exercise targeting the pectorals.",
      "imageUrls": [
        "https://ik.imagekit.io/app/workouts/exercises/bench-1.jpg",
        "https://ik.imagekit.io/app/workouts/exercises/bench-2.jpg"
      ],
      "videoUrl": "https://example.com/videos/bench-press.mp4",
      "muscleGroup": "CHEST",
      "createdById": "trainer-uuid",
      "createdAt": "2026-06-30T10:00:00.000Z",
      "updatedAt": "2026-06-30T10:00:00.000Z"
    }
  }
}
```

### 2. Create player exercise and auto-copy to catalog

- Method: `POST`
- URL: `/api/workouts/days/:dayId/exercises`
- Content-Type: `multipart/form-data`
- Role: `TRAINER`

Form-data fields:

- `name` required, string
- `description` optional, string
- `videoUrl` optional, string URL
- `muscleGroup` required
- `sortOrder` optional, integer
- `images` optional, multiple image files

Example cURL:

```bash
curl -X POST "http://localhost:3000/api/workouts/days/<DAY_ID>/exercises" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=Incline Dumbbell Press" \
  -F "description=Upper chest focus." \
  -F "videoUrl=https://example.com/videos/incline-dumbbell-press.mp4" \
  -F "muscleGroup=CHEST" \
  -F "sortOrder=2" \
  -F "images=@C:/files/incline-1.jpg"
```

Success response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Exercise created",
  "data": {
    "exercise": {
      "id": "exercise-uuid",
      "dayId": "day-uuid",
      "name": "Incline Dumbbell Press",
      "description": "Upper chest focus.",
      "imageUrls": [
        "https://ik.imagekit.io/app/workouts/exercises/incline-1.jpg"
      ],
      "videoUrl": "https://example.com/videos/incline-dumbbell-press.mp4",
      "muscleGroup": "CHEST",
      "sortOrder": 2
    }
  }
}
```

Notes:

- This endpoint still creates the player exercise and a reusable catalog copy in one backend flow.
- If no `images` files are sent, `imageUrls` will be an empty array.

### 3. List catalog exercises

- Method: `GET`
- URL: `/api/workouts/catalog/exercises`
- Optional query: `?muscleGroup=CHEST`

Success response shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Workout catalog exercises",
  "data": {
    "exercises": [
      {
        "id": "exercise-catalog-uuid",
        "name": "Barbell Bench Press",
        "description": "Compound chest exercise targeting the pectorals.",
        "imageUrls": [
          "https://ik.imagekit.io/app/workouts/exercises/bench-1.jpg"
        ],
        "videoUrl": "https://example.com/videos/bench-press.mp4",
        "muscleGroup": "CHEST",
        "createdById": "trainer-uuid",
        "createdAt": "2026-06-30T10:00:00.000Z",
        "updatedAt": "2026-06-30T10:00:00.000Z"
      }
    ]
  }
}
```

## Meal APIs

## Important multipart note for meals

Because meal creation now uses `multipart/form-data`, `ingredients` must be sent as a JSON string.

Valid example:

```json
[
  { "name": "Oats", "quantity": "60g", "calories": 230, "sortOrder": 0 },
  { "name": "Banana", "quantity": "1 medium", "calories": 105, "sortOrder": 1 }
]
```

### 1. Create catalog meal directly

- Method: `POST`
- URL: `/api/nutrition/catalog/meals`
- Content-Type: `multipart/form-data`
- Role: `TRAINER`

Form-data fields:

- `section` required, one of:
  - `BREAKFAST`
  - `LUNCH`
  - `DINNER`
- `name` required, string
- `calories` required, integer
- `ingredients` required, JSON string array
- `image` required, single image file

Example cURL:

```bash
curl -X POST "http://localhost:3000/api/nutrition/catalog/meals" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "section=BREAKFAST" \
  -F "name=Oatmeal with Banana" \
  -F "calories=420" \
  -F "ingredients=[{\"name\":\"Oats\",\"quantity\":\"60g\",\"calories\":230,\"sortOrder\":0},{\"name\":\"Banana\",\"quantity\":\"1 medium\",\"calories\":105,\"sortOrder\":1},{\"name\":\"Milk\",\"quantity\":\"200ml\",\"calories\":85,\"sortOrder\":2}]" \
  -F "image=@C:/files/oatmeal.jpg"
```

Success response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Catalog meal created",
  "data": {
    "meal": {
      "id": "catalog-meal-uuid",
      "section": "breakfast",
      "name": "Oatmeal with Banana",
      "imageUrl": "https://ik.imagekit.io/app/nutrition/meals/oatmeal.jpg",
      "calories": 420,
      "createdById": "trainer-uuid",
      "ingredients": [
        {
          "id": "ingredient-uuid-1",
          "name": "Oats",
          "quantity": "60g",
          "calories": 230,
          "sortOrder": 0
        },
        {
          "id": "ingredient-uuid-2",
          "name": "Banana",
          "quantity": "1 medium",
          "calories": 105,
          "sortOrder": 1
        }
      ]
    }
  }
}
```

### 2. Create player meal and auto-copy to catalog

- Method: `POST`
- URL: `/api/nutrition/players/:playerId/meals`
- Content-Type: `multipart/form-data`
- Role: `TRAINER`

Form-data fields:

- `section` required: `BREAKFAST`, `LUNCH`, `DINNER`
- `name` required
- `calories` required
- `ingredients` required, JSON string array
- `image` required, single image file

Example cURL:

```bash
curl -X POST "http://localhost:3000/api/nutrition/players/<PLAYER_ID>/meals" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "section=LUNCH" \
  -F "name=Grilled Chicken Rice Bowl" \
  -F "calories=650" \
  -F "ingredients=[{\"name\":\"Chicken breast\",\"quantity\":\"180g\",\"calories\":300},{\"name\":\"Rice\",\"quantity\":\"150g\",\"calories\":200},{\"name\":\"Mixed vegetables\",\"quantity\":\"100g\",\"calories\":80},{\"name\":\"Olive oil\",\"quantity\":\"1 tbsp\",\"calories\":70}]" \
  -F "image=@C:/files/chicken-bowl.jpg"
```

Success response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Meal created",
  "data": {
    "meal": {
      "id": "meal-uuid",
      "playerId": "player-uuid",
      "trainerId": "trainer-uuid",
      "section": "lunch",
      "name": "Grilled Chicken Rice Bowl",
      "imageUrl": "https://ik.imagekit.io/app/nutrition/meals/chicken-bowl.jpg",
      "calories": 650,
      "ingredients": [
        {
          "id": "ingredient-uuid-1",
          "name": "Chicken breast",
          "quantity": "180g",
          "calories": 300,
          "sortOrder": 0
        },
        {
          "id": "ingredient-uuid-2",
          "name": "Rice",
          "quantity": "150g",
          "calories": 200,
          "sortOrder": 1
        }
      ]
    }
  }
}
```

Notes:

- This endpoint still creates the player meal and a reusable catalog meal copy in one backend flow.
- `image` is required for meal creation.

### 3. List catalog meals

- Method: `GET`
- URL: `/api/nutrition/catalog/meals`
- Optional query: `?section=breakfast`

Success response without filter:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nutrition catalog meals",
  "data": {
    "sections": {
      "breakfast": [
        {
          "id": "catalog-meal-uuid",
          "section": "breakfast",
          "name": "Oatmeal with Banana",
          "imageUrl": "https://ik.imagekit.io/app/nutrition/meals/oatmeal.jpg",
          "calories": 420,
          "createdById": "trainer-uuid",
          "ingredients": [
            {
              "id": "ingredient-uuid-1",
              "name": "Oats",
              "quantity": "60g",
              "calories": 230,
              "sortOrder": 0
            }
          ]
        }
      ],
      "lunch": [],
      "dinner": []
    }
  }
}
```

Success response with filter:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nutrition catalog meals",
  "data": {
    "meals": [
      {
        "id": "catalog-meal-uuid",
        "section": "breakfast",
        "name": "Oatmeal with Banana",
        "imageUrl": "https://ik.imagekit.io/app/nutrition/meals/oatmeal.jpg",
        "calories": 420,
        "createdById": "trainer-uuid",
        "ingredients": [
          {
            "id": "ingredient-uuid-1",
            "name": "Oats",
            "quantity": "60g",
            "calories": 230,
            "sortOrder": 0
          }
        ]
      }
    ]
  }
}
```

## Error Notes

Common error cases:

- non-image upload file:
  - `400`
  - message: `Only image files are allowed`
- invalid `ingredients` JSON in multipart:
  - `400`
  - validation error on `ingredients`
- meal create without image file:
  - `400`
  - message: `Meal image file is required`
- invalid meal section query:
  - `400`
  - message: `Invalid section. Use breakfast, lunch, or dinner.`

## Frontend Integration Notes

- For workout create endpoints, send `multipart/form-data`.
- Repeat `images` multiple times for multiple exercise images.
- For meal create endpoints, send exactly one `image` file.
- For meal create endpoints, send `ingredients` as a stringified JSON array.
- Exercise `videoUrl` stays a text field, not a file.
- Meal request `section` is uppercase, but response `section` is lowercase.
