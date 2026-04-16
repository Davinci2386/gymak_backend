
---

## API overview

| Method | Endpoint | Auth | Notes |
|--------|----------|------|--------|
| **GET** | `/api/health` | No | Liveness check |

### User (`/api/user`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|--------|
| **POST** | `/api/user/auth/register` | No | Player registration (JSON) |
| **POST** | `/api/user/auth/login` | No | Returns tokens |
| **POST** | `/api/user/auth/refresh` | No | Body: refresh token |
| **POST** | `/api/user/auth/logout` | No | Body: refresh token |
| **GET** | `/api/user/me` | Yes | Current user profile |

### Trainer (`/api/trainer`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|--------|
| **GET** | `/api/trainer` | No | Public list of trainers |
| **POST** | `/api/trainer/auth/register` | No | Trainer signup; `multipart/form-data`, optional `certificates[]` files |

### Subscriptions & trainer assignment (`/api/subscriptions`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|--------|
| **POST** | `/api/subscriptions/trainer-requests` | Yes (`USER`) | Request a trainer |
| **GET** | `/api/subscriptions/trainer-requests/me` | Yes (`USER`) | Current user’s requests |
| **POST** | `/api/subscriptions/trainer-requests/:requestId/cancel` | Yes (`USER`) | Cancel a request |
| **GET** | `/api/subscriptions/trainer-requests/inbox` | Yes (`TRAINER`) | Trainer inbox |
| **POST** | `/api/subscriptions/trainer-requests/:requestId/approve` | Yes (`TRAINER`) | Approve request |
| **POST** | `/api/subscriptions/trainer-requests/:requestId/reject` | Yes (`TRAINER`) | Reject request |
| **GET** | `/api/subscriptions/assignment/me` | Yes (`USER`) | Current trainer assignment |

---

## Mounted prefixes (no routes yet)

These paths are registered in the app but only contain placeholders (`TODO`). They return **404** for any path until routes are added.

| Prefix | Purpose (planned) |
|--------|-------------------|
| `/api/admin` | Admin |
| `/api/workouts` | Workouts |
| `/api/nutrition` | Nutrition |
| `/api/chat` | Chat |
| `/api/payments` | Payments |
| `/api/notifications` | Notifications |
| `/api/locations` | Locations / map |

---

## Authentication

Protected routes expect:

`Authorization: Bearer <access_token>`

Role checks use the `authorize('USER' | 'TRAINER')` middleware as noted in the tables above.

---

## Additional docs

- [docs/AUTH.md](./docs/AUTH.md) — Auth flows and environment variables
