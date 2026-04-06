# Local setup (Docker)

Short guide to run the backend with Docker Compose. **Clone the repo separately** if you have not already.

---

## Prerequisites

- **Docker Desktop** (includes Docker Compose v2)

---


## 1. Build and start all services

From the project root:

```bash
docker compose up --build -d
```

- **App:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL:** port `5432` on the host

Check that containers are running:

```bash
docker compose ps
```

---

## 3. Apply database migrations

The image runs `prisma generate` at build time; migrations are **not** applied automatically on server start. After containers are healthy, run:

```bash
docker compose exec app npx prisma migrate deploy
```

---

## 4. Stop the stack

Stop containers (keeps the database volume):

```bash
docker compose down
```

Stop and **remove** the Postgres data volume (fresh DB next time):

```bash
docker compose down -v
```

---

## Optional: Node on the host + Postgres in Docker only

Useful if you prefer `npm run dev` on your machine while the database stays in Docker.

1. Start only Postgres:

   ```bash
   docker compose up -d postgres
   ```

2. In `.env`, set `DATABASE_URL` to use **`localhost`** and the same user, password, and database as in `docker-compose.yml` (e.g. `workout_user`, `workout_pass`, `workout_db`).

3. Install dependencies and run migrations, then the dev server:

   ```bash
   npm ci
   npx prisma migrate dev
   npm run dev
   ```

---

## Quick reference

| Step              | Command                                              |
|-------------------|------------------------------------------------------|
| Start (build)     | `docker compose up --build -d`                       |
| Migrations        | `docker compose exec app npx prisma migrate deploy`  |
| Status            | `docker compose ps`                                  |
| Stop              | `docker compose down`                                |
| Stop + wipe DB    | `docker compose down -v`                             |
