# 🔐 Admin Setup Guide

> Arabic Version Below (Click [here](#arabic-version))

## Quick Start

### 1. Create Initial Admin Account

After the app is running in Docker, create an admin account:

```bash
# Using default credentials
docker compose exec app node prisma/seed-admin.js

# OR with custom credentials (recommended)
docker compose exec app node prisma/seed-admin.js admin@mycompany.com MySecurePassword123
```

**Output**:
```
🔐 Creating admin account...
📧 Email: admin@mycompany.com
✅ Admin account created successfully!

📋 Admin Details:
   ID: uuid-here
   Email: admin@mycompany.com
   Name: System Admin
   Role: ADMIN
   Created: 2026-04-20T10:00:00Z

🔑 Login Credentials:
   Email: admin@mycompany.com
   Password: MySecurePassword123 (Change this immediately!)

⚠️  IMPORTANT:
   - Use these credentials to login at POST /api/admin/auth/login
   - Change password immediately after first login using POST /api/admin/change-password
   - Keep credentials secure - do not share or commit to version control
```

### 2. Admin Login

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "MySecurePassword123"
  }'
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin logged in successfully",
  "data": {
    "admin": {
      "id": "admin-uuid",
      "firstName": "System",
      "lastName": "Admin",
      "email": "admin@mycompany.com",
      "role": "ADMIN",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4..."
  }
}
```

### 3. Change Password (Recommended)

```bash
curl -X POST http://localhost:5000/api/admin/change-password \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "MySecurePassword123",
    "newPassword": "NewSecurePassword456"
  }'
```

---

## 📊 Admin Capabilities Summary

| Feature | Endpoint | Method | Protected |
|---------|----------|--------|-----------|
| **Authentication** |
| Login | `/api/admin/auth/login` | POST | ❌ No |
| Refresh Token | `/api/admin/auth/refresh` | POST | ✅ Yes |
| Logout | `/api/admin/auth/logout` | POST | ✅ Yes |
| **Profile** |
| Get Profile | `/api/admin/me` | GET | ✅ Yes |
| Update Profile | `/api/admin/profile` | PUT | ✅ Yes |
| Change Password | `/api/admin/change-password` | POST | ✅ Yes |
| **Management** |
| Register Admin | `/api/admin/register` | POST | ✅ Yes (Admin only) |
| **Subscriptions** |
| Create Plan | `/api/subscriptions/plans` | POST | ✅ Yes (Admin only) |
| Update Plan | `/api/subscriptions/plans/:planId` | PUT | ✅ Yes (Admin only) |
| List Plans | `/api/subscriptions/plans` | GET | ❌ No (Public) |
| **Payments** |
| Refund Payment | `/api/payments/:paymentId/refund` | POST | ✅ Yes (Admin only) |
| Payment History | `/api/payments/history` | GET | ✅ Yes (Any user) |

---

## 🗂️ Admin Module Structure

```
src/modules/admin/
├── controller/
│   └── admin.controller.js      # ✅ IMPLEMENTED
│       └── login()
│       └── register()
│       └── refresh()
│       └── logout()
│       └── changePassword()
│       └── getProfile()
│       └── updateProfile()
│
├── service/
│   └── admin.service.js         # ✅ IMPLEMENTED
│       └── login()              # Verify credentials
│       └── register()           # Create new admin
│       └── changePassword()     # Update password
│       └── getProfile()         # Retrieve admin info
│       └── updateProfile()      # Update admin details
│       └── refresh()            # Refresh tokens
│       └── logout()             # Revoke session
│
├── repository/
│   ├── admin.repository.js      # ✅ IMPLEMENTED
│   │   └── Database queries for admins
│   │
│   └── session.repository.js    # ✅ IMPLEMENTED
│       └── Session/token management
│
├── validators/
│   └── admin.schemas.js         # ✅ IMPLEMENTED
│       └── adminLoginSchema
│       └── adminRegisterSchema
│       └── changePasswordSchema
│       └── updateAdminProfileSchema
│       └── refreshTokenSchema
│
└── routes/
    └── admin.routes.js          # ✅ IMPLEMENTED
        └── All endpoints configured
```

---

## ✨ Key Features

### 1. **Secure Authentication**
- JWT-based access tokens (1 hour expiry)
- Refresh tokens (30 day expiry)
- Bcrypt password hashing (salt=12)
- Server-side session tracking

### 2. **Password Management**
- Strong password requirements
- Secure password changes
- Password validation (min 6 characters)
- Prevents password reuse

### 3. **Admin Operations**
- Create/update subscription plans
- Refund payments
- Create additional admin accounts
- Manage own profile

### 4. **Consistent API Design**
- Standard response format: `{success, statusCode, message, data}`
- Consistent error handling
- Request validation with Joi schemas
- Database queries via repositories

---

## 🔧 Technical Details

### Database Models
```prisma
// Admin is a User with role='ADMIN'
model User {
  id              String    @id @default(uuid())
  firstName       String
  lastName        String
  email           String    @unique
  passwordHash    String    // bcrypt(salt=12)
  role            String    // "ADMIN", "USER", "TRAINER"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Token sessions
model UserSession {
  id               String    @id @default(uuid())
  userId           String
  refreshTokenHash String    @unique  // SHA256 hash
  expiresAt        DateTime
  revokedAt        DateTime?   // NULL = active
}
```

### Token Lifecycle
```
1. Login → Generate JWT (1h) + Refresh Token (stored as SHA256 hash)
2. Use JWT for requests (Bearer token)
3. JWT expires → Use refresh token to get new JWT
4. Revoke old session → Create new session with new tokens
5. Logout → Mark session as revoked
```

### Authorization Pattern
```javascript
// Middleware chain
auth → authorize('ADMIN') → validate(schema) → controller
```

---

## 🐳 Docker Commands

### Create Admin in Running Container
```bash
docker compose exec app node prisma/seed-admin.js
```

### Rebuild and Start Fresh
```bash
# Stop and remove containers
docker compose down

# Rebuild and start
docker compose up --build -d

# Create admin
docker compose exec app node prisma/seed-admin.js admin@email.com password
```

### View Logs
```bash
docker compose logs app -f
```

---

## 🧪 Testing Workflow

### 1. Start Server
```bash
docker compose up -d
```

### 2. Create Admin Account
```bash
docker compose exec app node prisma/seed-admin.js admin@test.com testpass123
```

### 3. Login and Get Token
```bash
# Save response to get accessToken and refreshToken
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "testpass123"
  }'
```

### 4. Use Token for Admin Operations
```bash
# Use accessToken in Authorization header
curl -X GET http://localhost:5000/api/admin/me \
  -H "Authorization: Bearer <access-token>"
```

### 5. Create Subscription Plan
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Professional tier",
    "price": 9999,
    "durationDays": 30,
    "features": ["Video library", "Personal trainer"]
  }'
```

---

## 📝 Notes

- **First Admin**: Must be created via seed script (no existing admin to register it)
- **Additional Admins**: Can be created via `/api/admin/register` by existing admin
- **Token Storage**: Store tokens in secure storage (httpOnly cookies, secure storage, NOT localStorage)
- **Password**: Change default password immediately after first login
- **Security**: Do not expose tokens or credentials in logs/error messages

---

## 🆘 Troubleshooting

### "Admin not created"
```bash
# Check Prisma is running
docker compose exec app npx prisma generate
docker compose exec app npx prisma migrate dev

# Try seed script again
docker compose exec app node prisma/seed-admin.js
```

### "Invalid refresh token"
```
- Tokens are session-specific
- Cannot reuse old refresh tokens after refreshing
- Must use returned new tokens
```

### "Admin not found" on login
```
- Verify email is correct (case-sensitive)
- Create admin account first with seed script
- Check database connection
```

---

## 📚 See Also

- [ADMIN.md](./ADMIN.md) - Detailed API documentation
- [AUTH.md](./AUTH.md) - General authentication documentation
- [Module Architecture](./MODULE_ARCHITECTURE.md) - Project structure guide

---

---

# 🔐 دليل إعداد الإدمن

> (النسخة العربية)

## البداية السريعة

### 1. إنشاء حساب الإدمن الأول

بعد تشغيل التطبيق في Docker:

```bash
# باستخدام بيانات اعتماد افتراضية
docker compose exec app node prisma/seed-admin.js

# أو ببيانات اعتماد مخصصة (موصى به)
docker compose exec app node prisma/seed-admin.js admin@mycompany.com كلمةالمرور123
```

**المخرجات**:
```
🔐 جاري إنشاء حساب الإدمن...
📧 البريد الإلكتروني: admin@mycompany.com
✅ تم إنشاء حساب الإدمن بنجاح!

📋 تفاصيل الإدمن:
   ID: uuid-هنا
   البريد الإلكتروني: admin@mycompany.com
   الاسم: System Admin
   الدور: ADMIN
   تاريخ الإنشاء: 2026-04-20T10:00:00Z

🔑 بيانات الدخول:
   البريد الإلكتروني: admin@mycompany.com
   كلمة المرور: كلمةالمرور123 (غيّرها فوراً!)

⚠️  تنبيهات مهمة:
   - استخدم هذه البيانات للدخول إلى POST /api/admin/auth/login
   - غيّر كلمة المرور فوراً بعد الدخول الأول عبر POST /api/admin/change-password
   - احفظ بيانات المرور - لا تشاركها ولا تحفظها في الكود
```

### 2. دخول الإدمن

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "كلمةالمرور123"
  }'
```

### 3. تغيير كلمة المرور

```bash
curl -X POST http://localhost:5000/api/admin/change-password \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "كلمةالمرور123",
    "newPassword": "كلمةالمرورالجديدة456"
  }'
```

---

## 💪 الإمكانيات الحالية للإدمن

1. **إدارة خطط الاشتراك**
   - ✅ إنشاء خطط جديدة: `POST /api/subscriptions/plans`
   - ✅ تعديل الخطط: `PUT /api/subscriptions/plans/:planId`
   - ✅ عرض الخطط: `GET /api/subscriptions/plans`

2. **إدارة الدفع**
   - ✅ استرجاع الأموال: `POST /api/payments/:paymentId/refund`
   - ✅ عرض سجل الدفع: `GET /api/payments/history`

3. **إدارة الإدمن**
   - ✅ تسجيل إدمن جديد: `POST /api/admin/register`
   - ✅ تسجيل دخول: `POST /api/admin/auth/login`
   - ✅ تحديث الملف الشخصي: `PUT /api/admin/profile`
   - ✅ تغيير كلمة المرور: `POST /api/admin/change-password`
   - ✅ عرض الملف الشخصي: `GET /api/admin/me`

---

## 📊 ملخص النقاط المهمة

| الميزة | الطلب | الطريقة | محمي |
|-------|------|--------|------|
| **المصادقة** |
| دخول | `/api/admin/auth/login` | POST | ❌ |
| تحديث التوكن | `/api/admin/auth/refresh` | POST | ✅ |
| خروج | `/api/admin/auth/logout` | POST | ✅ |
| **الملف الشخصي** |
| عرض الملف | `/api/admin/me` | GET | ✅ |
| تحديث الملف | `/api/admin/profile` | PUT | ✅ |
| تغيير كلمة المرور | `/api/admin/change-password` | POST | ✅ |
| **الإدارة** |
| تسجيل إدمن | `/api/admin/register` | POST | ✅ (إدمن فقط) |

---

## 🔒 متطلبات الأمان

1. ✅ تشفير كلمات المرور بـ bcrypt (salt=12)
2. ✅ توكن JWT مع انتهاء صلاحية تلقائي (ساعة واحدة)
3. ✅ تتبع الجلسات في قاعدة البيانات
4. ✅ التحقق من الصلاحيات لكل عملية إدارية
5. ✅ منع إعادة استخدام كلمات المرور

---

## 📁 هيكل الملف

```
✅ src/modules/admin/
   ✅ controller/admin.controller.js    # معالجة الطلبات
   ✅ service/admin.service.js          # منطق الأعمال
   ✅ repository/
      ✅ admin.repository.js            # استعلامات قاعدة البيانات
      ✅ session.repository.js          # إدارة الجلسات
   ✅ validators/admin.schemas.js       # التحقق من الصحة
   ✅ routes/admin.routes.js            # المسارات والـ Endpoints
```

---

**تم التحديث**: 20 أبريل 2026  
**النسخة**: 1.0.0
