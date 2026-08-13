---

## API overview

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/health` | No | Liveness check |

### User (`/api/user`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `POST` | `/api/user/auth/register` | No | Player registration |
| `POST` | `/api/user/auth/login` | No | Returns access and refresh tokens |
| `POST` | `/api/user/auth/refresh` | No | Body contains refresh token |
| `POST` | `/api/user/auth/logout` | No | Body contains refresh token |
| `GET` | `/api/user/me` | Yes | Current user profile |

### Trainer (`/api/trainer`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/trainer` | No | Public trainer list |
| `POST` | `/api/trainer/auth/register` | No | `application/json`, optional `certificates: string[]` (legacy multipart files are converted to names) |

### Posts (`/api/posts`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/posts` | No | Public approved posts list with pagination |
| `GET` | `/api/posts/:postId` | No | One public approved post |
| `GET` | `/api/posts/mine` | Yes (`TRAINER`) | Trainer's own posts with all statuses |
| `POST` | `/api/posts` | Yes (`TRAINER`) | Create post, `multipart/form-data`, optional `image` |
| `PUT` | `/api/posts/:postId` | Yes (`TRAINER`) | Update own post, re-sends it for admin review |
| `DELETE` | `/api/posts/:postId` | Yes (`TRAINER`) | Delete own post |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `POST` | `/api/notifications/tokens` | Yes | Register/update current device FCM token |
| `DELETE` | `/api/notifications/tokens` | Yes | Delete current device FCM token |

### Chat (`/api/chat`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/chat/firebase-token` | Yes (`USER`/`TRAINER`) | Sync active assignment conversations and create a Firebase custom token using the backend user ID |

### Subscriptions & assignment (`/api/subscriptions`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `POST` | `/api/subscriptions/trainer-requests` | Yes (`USER`) | Request a trainer |
| `GET` | `/api/subscriptions/trainer-requests/me` | Yes (`USER`) | Current player requests |
| `POST` | `/api/subscriptions/trainer-requests/:requestId/cancel` | Yes (`USER`) | Cancel request |
| `GET` | `/api/subscriptions/trainer-requests/inbox` | Yes (`TRAINER`) | Trainer inbox |
| `GET` | `/api/subscriptions/trainer/players` | Yes (`TRAINER`) | Trainer active players |
| `POST` | `/api/subscriptions/trainer-requests/:requestId/approve` | Yes (`TRAINER`) | Approve request |
| `POST` | `/api/subscriptions/trainer-requests/:requestId/reject` | Yes (`TRAINER`) | Reject request |
| `GET` | `/api/subscriptions/assignment/me` | Yes (`USER`) | Current active assignment |
| `GET` | `/api/subscriptions/trainer-status/me` | Yes (`USER`) | Unified trainer state for splash/onboarding |
| `GET` | `/api/subscriptions/plans` | No | List active subscription plans |
| `POST` | `/api/subscriptions/plans` | Yes (`ADMIN`) | Create subscription plan |
| `PUT` | `/api/subscriptions/plans/:planId` | Yes (`ADMIN`) | Update subscription plan |
| `POST` | `/api/subscriptions/create-payment` | Yes | Create payment intent |
| `GET` | `/api/subscriptions/me` | Yes | Current user subscription |
| `POST` | `/api/subscriptions/cancel` | Yes | Cancel current subscription |
| `GET` | `/api/subscriptions/payments/history` | Yes | Payment history |
| `POST` | `/api/subscriptions/payments/:paymentId/refund` | Yes (`ADMIN`) | Refund payment |

### Workouts (`/api/workouts`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/workouts/plan` | Yes (`USER`) | Current player workout plan |
| `GET` | `/api/workouts/catalog/exercises` | Yes (`TRAINER`) | Reusable exercise catalog |
| `GET` | `/api/workouts/players/:playerId/plan` | Yes (`TRAINER`) | One player's workout plan |
| `POST` | `/api/workouts/players/:playerId/days` | Yes (`TRAINER`) | Create a day in player plan |
| `PUT` | `/api/workouts/days/:dayId` | Yes (`TRAINER`) | Update day |
| `DELETE` | `/api/workouts/days/:dayId` | Yes (`TRAINER`) | Delete day |
| `POST` | `/api/workouts/days/:dayId/exercises` | Yes (`TRAINER`) | Create custom exercise in player day |
| `POST` | `/api/workouts/days/:dayId/exercises/from-catalog` | Yes (`TRAINER`) | Copy exercise from catalog |
| `PUT` | `/api/workouts/exercises/:exerciseId` | Yes (`TRAINER`) | Update player exercise |
| `DELETE` | `/api/workouts/exercises/:exerciseId` | Yes (`TRAINER`) | Delete player exercise |

### Nutrition (`/api/nutrition`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/nutrition/meals` | Yes (`USER`) | Current player nutrition plan |
| `GET` | `/api/nutrition/meals/:mealId` | Yes (`USER`) | One assigned meal |
| `GET` | `/api/nutrition/catalog/meals` | Yes (`TRAINER`) | Reusable meal catalog |
| `GET` | `/api/nutrition/players/:playerId/meals` | Yes (`TRAINER`) | One player's assigned meals |
| `POST` | `/api/nutrition/players/:playerId/meals` | Yes (`TRAINER`) | Create custom meal for player and add it to catalog |
| `POST` | `/api/nutrition/players/:playerId/meals/from-catalog` | Yes (`TRAINER`) | Copy meal from catalog |
| `PUT` | `/api/nutrition/meals/:mealId` | Yes (`TRAINER`) | Update player-assigned meal |
| `DELETE` | `/api/nutrition/meals/:mealId` | Yes (`TRAINER`) | Delete player-assigned meal |

### Mounted prefixes

| Prefix | Purpose |
|--------|---------|
| `/api/admin` | Admin auth and profile |
| `/api/chat` | Chat |
| `/api/payments` | Stripe webhook and payment helpers |
| `/api/notifications` | Notifications |
| `/api/chat` | Secure player/trainer chat authentication |
| `/api/locations` | Locations / map |

### Admin Post Endpoints (`/api/admin`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `GET` | `/api/admin/posts` | Yes (`ADMIN`) | List posts, supports `status`, `page`, `limit` |
| `GET` | `/api/admin/posts/:postId` | Yes (`ADMIN`) | One post with review details |
| `POST` | `/api/admin/posts/:postId/approve` | Yes (`ADMIN`) | Approve post |
| `POST` | `/api/admin/posts/:postId/reject` | Yes (`ADMIN`) | Reject post with `rejectionReason` |

### Admin Notification Endpoints (`/api/admin`)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| `POST` | `/api/admin/notifications/users/:userId` | Yes (`ADMIN`) | Send push notification to one user |
| `POST` | `/api/admin/notifications/trainers/:trainerId` | Yes (`ADMIN`) | Send push notification to one trainer |
| `POST` | `/api/admin/notifications/broadcast` | Yes (`ADMIN`) | Send push notification to all users/trainers or one audience |
