# Songs Feature

## What Was Implemented

A full songs section was added using the same project pattern:
Routes -> Controller -> Service -> Repository -> Prisma.

Implemented items:

- Added `Song` model to Prisma schema.
- Added optional relation to `User` for tracking creator admin (`createdByAdminId`).
- Added new module: `src/modules/song`.
- Mounted new router in `src/app.js` at `/api/songs`.

## File Structure

- `prisma/schema.prisma`
- `prisma/migrations/20260507120000_add_songs_feature/migration.sql`
- `src/app.js`
- `src/modules/song/routes/song.routes.js`
- `src/modules/song/controller/song.controller.js`
- `src/modules/song/service/song.service.js`
- `src/modules/song/repository/song.repository.js`
- `src/modules/song/validators/song.schemas.js`

## Database Model

`Song` fields:

- `id` (UUID)
- `title`
- `artist`
- `coverImageUrl`
- `mp3Url`
- `durationSeconds`
- `createdByAdminId` (optional)
- `createdAt`
- `updatedAt`

## Available APIs

Base URL: `/api/songs`

### 1) List songs (USER)

- Method: `GET`
- Path: `/api/songs`
- Auth: `Bearer` token, role = `USER`
- Purpose: Returns all songs added by admins.

### 2) Get single song (USER)

- Method: `GET`
- Path: `/api/songs/:songId`
- Auth: `Bearer` token, role = `USER`
- Purpose: Returns one song details.

### 3) Create song (ADMIN)

- Method: `POST`
- Path: `/api/songs`
- Auth: `Bearer` token, role = `ADMIN`

Request body example:

```json
{
  "title": "Believer",
  "artist": "Imagine Dragons",
  "coverImageUrl": "https://example.com/believer-cover.jpg",
  "mp3Url": "https://example.com/believer.mp3"
}
```

### 4) Update song (ADMIN)

- Method: `PUT`
- Path: `/api/songs/:songId`
- Auth: `Bearer` token, role = `ADMIN`
- Notes: Partial update is supported, including manual `durationSeconds` updates.

### 5) Delete song (ADMIN)

- Method: `DELETE`
- Path: `/api/songs/:songId`
- Auth: `Bearer` token, role = `ADMIN`

## Prisma Commands To Run

For local development:

```bash
npx prisma format
npx prisma migrate dev
npx prisma generate
```

For production:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Notes

- `coverImageUrl` and `mp3Url` are validated as URI.
- On create, `durationSeconds` is resolved automatically from `mp3Url` using `music-metadata`.
- If duration extraction fails, `durationSeconds` is saved as `0`.
- Manual `durationSeconds` update is still allowed in `PUT /api/songs/:songId`.
- Missing song returns `404` with message `Song not found`.
