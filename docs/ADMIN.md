# Admin Module Documentation

## 📋 Overview

The Admin module provides authentication and management capabilities for administrators. Admins have elevated privileges to manage platform users, subscriptions, payments, and other administrative operations.

---

## 🔐 Admin Authentication

### 1. Admin Login
**Endpoint**: `POST /api/admin/auth/login`

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin logged in successfully",
  "data": {
    "admin": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

**Authentication**: None (public endpoint)

---

### 2. Register New Admin
**Endpoint**: `POST /api/admin/register`

**Prerequisites**: Admin must be logged in (Authentication required)

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Admin",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Admin registered successfully",
  "data": {
    "admin": {
      "id": "uuid-here",
      "firstName": "Jane",
      "lastName": "Admin",
      "email": "jane@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Headers Required**:
```
Authorization: Bearer <admin-access-token>
```

**Authorization**: `ADMIN` role required

---

### 3. Refresh Admin Token
**Endpoint**: `POST /api/admin/auth/refresh`

**Request**:
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "admin": { ... },
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

**Purpose**: 
- Obtain new access token when current one expires
- Session tokens are 1 hour
- Refresh tokens are valid for 30 days

---

### 4. Logout Admin
**Endpoint**: `POST /api/admin/auth/logout`

**Request**:
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin logged out successfully",
  "data": null
}
```

**Headers Required**:
```
Authorization: Bearer <admin-access-token>
```

---

## 👤 Admin Profile Management

### 1. Get Admin Profile
**Endpoint**: `GET /api/admin/me`

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin profile retrieved",
  "data": {
    "admin": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  }
}
```

**Headers Required**:
```
Authorization: Bearer <admin-access-token>
```

---

### 2. Update Admin Profile
**Endpoint**: `PUT /api/admin/profile`

**Request** (all fields optional):
```json
{
  "firstName": "Jonathan",
  "lastName": "Administrator",
  "email": "jonathan@example.com"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin profile updated successfully",
  "data": {
    "admin": {
      "id": "uuid-here",
      "firstName": "Jonathan",
      "lastName": "Administrator",
      "email": "jonathan@example.com",
      "role": "ADMIN",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:30:00Z"
    }
  }
}
```

**Headers Required**:
```
Authorization: Bearer <admin-access-token>
```

---

### 3. Change Admin Password
**Endpoint**: `POST /api/admin/change-password`

**Request**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": {
    "admin": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Admin",
      "email": "admin@example.com"
    }
  }
}
```

**Validation**:
- Current password must be correct
- New password must be at least 6 characters
- New password must be different from current password

**Headers Required**:
```
Authorization: Bearer <admin-access-token>
```

---

## ⚙️ Admin Capabilities

Admins have the following permissions:

### 1. **Subscription Plan Management**
- **Create subscription plans**: `POST /api/subscriptions/plans`
  - Define pricing tiers (USD in cents)
  - Set subscription duration (days)
  - Add features/benefits list
  - Minimum price: $1.00 (100 cents)
  - Minimum duration: 1 day

- **Update subscription plans**: `PUT /api/subscriptions/plans/:planId`
  - Modify pricing
  - Adjust duration
  - Enable/disable plans
  - Update features

- **List plans**: `GET /api/subscriptions/plans` (Public access)
  - View active subscription plans

### 2. **Payment Management**
- **Refund payments**: `POST /api/payments/:paymentId/refund`
  - Refund completed payments via Stripe
  - Cancel associated subscriptions
  - Log refund transactions
  - Only works for COMPLETED payments

- **View payment history**: `GET /api/payments/history` (User access, not admin-specific)
  - Track all payment transactions

### 3. **Admin User Management**
- **Register new admins**: `POST /api/admin/register`
  - Create additional admin accounts
  - Set initial credentials

- Registered admins can:
  - Management all subscription plans and payments
  - Create other admins
  - Access their own profile and security settings

---

## 🚀 Setup Instructions

### 1. Create First Admin Account

#### Option A: Using Seed Script
```bash
cd /path/to/workout_backend

# Create with default credentials (admin@workout.com / admin123456)
node prisma/seed-admin.js

# OR specify custom credentials
node prisma/seed-admin.js your-email@example.com your-password-here
```

#### Option B: Create via API
```bash
# First, use the seed script to create one admin, then use API to create others
POST /api/admin/register
Authorization: Bearer <first-admin-token>
```

### 2. Login with Admin Credentials
```bash
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@workout.com",
  "password": "admin123456"
}
```

### 3. Change Password Immediately
```bash
POST /api/admin/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "admin123456",
  "newPassword": "your-new-secure-password"
}
```

---

## 🔑 Token Management

### Access Token
- **Type**: JWT
- **Expiry**: 1 hour
- **Uses**: All authenticated requests
- **Header**: `Authorization: Bearer <token>`

### Refresh Token
- **Type**: Random 64-byte hex string (hashed)
- **Expiry**: 30 days
- **Uses**: Obtain new access tokens
- **Storage**: Securely hashed in database

### Token Refresh Flow
```
1. Access token expires (after 1 hour)
2. Call POST /api/admin/auth/refresh with refresh token
3. Get new access token + new refresh token
4. Previous refresh token is revoked
```

---

## 🔒 Security Best Practices

### For Admin Accounts:
1. **Unique Strong Passwords**
   - Minimum 6 characters (but use 12+ in production)
   - Mix of letters, numbers, and special characters
   - Do not reuse passwords

2. **Secure Token Storage**
   - Never commit tokens to version control
   - Use environment variables in production
   - Never expose in logs or error messages

3. **Regular Password Changes**
   - Change password periodically
   - Use different password from other services
   - Immediately change seed/default passwords

4. **Access Control**
   - Limit number of admin accounts
   - Remove access for departing team members
   - Use separate accounts instead of sharing credentials

5. **Session Management**
   - Logout when not actively using admin panel
   - Revoke tokens for inactive sessions
   - Monitor active admin sessions

---

## 📊 Admin Database Schema

### User Model (Admin)
```prisma
model User {
  id              String    @id @default(uuid())
  firstName       String
  lastName        String
  email           String    @unique
  passwordHash    String    // bcrypt hash (salt=12)
  role            String    // "ADMIN", "USER", "TRAINER"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  sessions        UserSession[]
  subscriptions   Subscription[]
  payments        Payment[]
}

model UserSession {
  id               String    @id @default(uuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id])
  refreshTokenHash String    @unique
  expiresAt        DateTime
  revokedAt        DateTime?
}
```

---

## 🧪 Testing Admin Endpoints

### cURL Examples

**Login**:
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@workout.com",
    "password": "admin123456"
  }'
```

**Get Profile**:
```bash
curl -X GET http://localhost:5000/api/admin/me \
  -H "Authorization: Bearer <access-token>"
```

**Change Password**:
```bash
curl -X POST http://localhost:5000/api/admin/change-password \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123456",
    "newPassword": "newPassword789"
  }'
```

**Create Subscription Plan**:
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Professional training plan",
    "price": 9999,
    "durationDays": 30,
    "features": ["Unlimited workouts", "Video library"]
  }'
```

---

## ❌ Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to access this resource",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Admin not found",
  "data": null
}
```

### 409 Conflict
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Admin with this email already exists",
  "data": null
}
```

---

## 📝 Module Structure

Following the project's consistent architecture:

```
src/modules/admin/
├── controller/
│   └── admin.controller.js      # Request/response handling
├── service/
│   └── admin.service.js         # Business logic
├── repository/
│   ├── admin.repository.js      # Admin queries
│   └── session.repository.js    # Session management
├── validators/
│   └── admin.schemas.js         # Request validation schemas
└── routes/
    └── admin.routes.js          # API routes & middleware
```

---

## 🔄 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. LOGIN (POST /api/admin/auth/login)                   │
├─────────────────────────────────────────────────────────┤
│ Email & Password → Service → bcrypt.compare()           │
│                  → Generate JWT (1h expiry)             │
│                  → Store refresh token hash (30d)       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │ Returns Access & Refresh      │
        │ Token to Client               │
        └──────────────────────────────┘
                       │
              ╔════════╩════════╗
              │                 │
              ↓                 ↓
    USE FOR REQUESTS    STORE SECURELY
    (1 hour expiry)    (30 day expiry)
              │                 │
              │         ┌───────↓────────┐
              │         │ Token Expired?  │
              │         ├─────────────────┤
              │         │ YES → REFRESH   │
              │         │ NO → Continue   │
              │         └────────────────┘
              │
              ↓
    ┌────────────────────┐
    │ Authorization      │
    │ Bearer <token>     │
    │ ↓ Middleware       │
    │ Verify JWT         │
    │ ↓ Extract role     │
    │ Check ADMIN role   │
    └────────────────────┘
```

---

**Version**: 1.0.0  
**Last Updated**: April 20, 2026  
**Maintainer**: Admin Module Team
