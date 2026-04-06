# Phase 1 — إسناد اللاعب لمدرب (بدون دفع)

هذا المستند يشرح سيناريو:

- اللاعب يسجل حساب.
- اللاعب يشوف قائمة المدربين ويختار واحد.
- اللاعب يرسل طلب للمدرب.
- المدرب يوافق أو يرفض.
- قبل الموافقة **اللاعب ما عنده وصول** لميزات مثل “تمارين/غذاء”.
- بعد الموافقة يصير عنده وصول (رح ننفذه لاحقًا بسهولة باستخدام middleware جاهز).

> ملاحظة: الدفع غير مربوط في هذه المرحلة.

---

## 1) التصميم العام (High-level)

نستخدم خيار A:

- المدرب هو `User` لكن `role = TRAINER`
- الإسناد يتغير عبر الزمن → نحتاج **سجل** و **حالة**

لهذا أضفنا جدولين:

1. **`TrainerRequest`**: طلب من لاعب → مدرب
2. **`TrainerAssignment`**: الإسناد الفعلي بعد موافقة المدرب

---

## 2) Prisma Models (DB Schema)

في `prisma/schema.prisma`:

- `User` (موجود)
- `TrainerRequest`:
  - `playerId`, `trainerId`
  - `status`: `PENDING | APPROVED | REJECTED | CANCELLED`
- `TrainerAssignment`:
  - `playerId`, `trainerId`
  - `status`: `ACTIVE | ENDED`
  - `startedAt`, `endedAt`

**المنطق:**

- عند موافقة المدرب:
  - ننهي أي إسناد `ACTIVE` سابق لهذا اللاعب (`ENDED`)
  - ننشئ إسناد جديد `ACTIVE`
  - نحدّث `TrainerRequest` إلى `APPROVED`

---

## 3) الـ Endpoints (API) في المرحلة 1

### 3.1) قائمة المدربين (لللاعب)

**GET** `/api/trainer`

يرجع قائمة مستخدمين role = TRAINER.

> لا يحتاج JWT. (ممكن لاحقًا تخليه محمي إذا بتحب)

---

### 3.2) اللاعب يرسل طلب للمدرب

**POST** `/api/subscriptions/trainer-requests`

Headers:

- `Authorization: Bearer <accessToken>`

Body:

```json
{
  "trainerId": "uuid"
}
```

الشروط:

- `trainerId` لازم يكون لمستخدم موجود و`role=TRAINER`
- لا يسمح بوجود طلب `PENDING` سابق لنفس المدرب
- لا يسمح إذا اللاعب أصلاً `ACTIVE` مع نفس المدرب

---

### 3.3) اللاعب يشوف طلباته

**GET** `/api/subscriptions/trainer-requests/me`

Headers:

- `Authorization: Bearer <accessToken>`

يرجع كل الطلبات (مع معلومات بسيطة عن المدرب).

---

### 3.4) اللاعب يلغي طلبه (قبل ما ينرد عليه)

**POST** `/api/subscriptions/trainer-requests/:requestId/cancel`

Headers:

- `Authorization: Bearer <accessToken>`

الشروط:

- لازم يكون الطلب ملك اللاعب
- لازم يكون `PENDING`

---

### 3.5) المدرب يشوف inbox (طلبات بانتظار الموافقة)

**GET** `/api/subscriptions/trainer-requests/inbox`

Headers:

- `Authorization: Bearer <accessToken>`

مسموح فقط للمدرب `role=TRAINER`.

---

### 3.6) المدرب يوافق

**POST** `/api/subscriptions/trainer-requests/:requestId/approve`

Headers:

- `Authorization: Bearer <accessToken>`

الشروط:

- الطلب لازم يكون للمدرب الحالي
- لازم يكون `PENDING`

النتيجة:

- ينشئ `TrainerAssignment` جديد `ACTIVE`

---

### 3.7) المدرب يرفض

**POST** `/api/subscriptions/trainer-requests/:requestId/reject`

Headers:

- `Authorization: Bearer <accessToken>`

نفس الشروط لكن يحدث `status=REJECTED`.

---

### 3.8) اللاعب يشوف إسناده الحالي

**GET** `/api/subscriptions/assignment/me`

Headers:

- `Authorization: Bearer <accessToken>`

يرجع:

- `assignment: null` إذا ما في إسناد
- أو assignment مع بيانات المدرب لو `ACTIVE`

---

## 4) “قبل الإسناد ما في Access” — كيف ننفذه صح؟

الفكرة: ما بنقفل كل API.

بنقفل فقط APIs اللي لازمها “وجود مدرب وإسناد فعال”، مثل:

- `GET /api/workouts/my-plan`
- `GET /api/nutrition/my-plan`

تم تجهيز middleware جاهز:

- `src/middleware/requireActiveAssignment.js`

آلية عمله:

1. يتأكد فيه JWT (`req.user`)
2. يبحث عن `TrainerAssignment` بحالة `ACTIVE` للاعب
3. إذا ما لقى → يرجع 403 برسالة “You are not assigned…”

عندما نبني workout/nutrition لاحقًا، نضيفه في routes:

```js
router.get('/my-plan', auth, authorize('USER'), requireActiveAssignment, workoutController.myPlan);
```

---

## 5) Flow كامل (Step-by-step)

### Flow اللاعب

1. `POST /api/user/auth/register`
2. `GET /api/trainer` للحصول على المدربين
3. `POST /api/subscriptions/trainer-requests` لإرسال طلب
4. (اختياري) `GET /api/subscriptions/trainer-requests/me` لمتابعة الحالة
5. بعد الموافقة:
   - `GET /api/subscriptions/assignment/me` يظهر الإسناد
   - بعدها يحق له استخدام APIs التي تتطلب `requireActiveAssignment`

### Flow المدرب

1. (المدرب لازم يكون حسابه موجود و`role=TRAINER`)
2. `GET /api/subscriptions/trainer-requests/inbox`
3. `POST /api/subscriptions/trainer-requests/:id/approve` أو `reject`

---

## 6) تطبيق الـ Migration (مهم)

بعد تعديل الـ schema وتشغيل PostgreSQL:

```bash
npx prisma migrate dev --name trainer_assignment_requests
```

> إذا Docker Desktop مش شغال أو Postgres مش شغال على `localhost:5432` رح يطلع خطأ `P1001`.

### تشغيل Postgres بـ Docker

```powershell
docker compose up -d postgres
```

بعدها نفّذ migration من جهازك:

```powershell
npx prisma migrate dev --name trainer_assignment_requests
```

---

## 7) ملاحظات لاحقًا (Phase 2+)

- ربط الدفع: نجعل الإسناد/الوصول يتطلب `paymentStatus=PAID` أو `subscriptionStatus=ACTIVE`.
- إضافة “طلب تغيير مدرب”: هو نفس flow الحالي تمامًا.
- إضافة “إنهاء الإسناد” يدويًا: endpoint يضع `ENDED`.

