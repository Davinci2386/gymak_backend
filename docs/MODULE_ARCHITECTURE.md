# بنية الـ Modules والـ Flow لكل ميزة

هذا الملف يشرح مفهوم **Module** في المشروع، دور كل مجلد داخله، وكيف تمر الطلبات بين الطبقات. في آخر الملف توجد **تدفقات تفصيلية (flow)** لميزة **User / Auth** الحالية؛ الميزات الأخرى تتبع نفس الفكرة عندما تُبنى.

---

## 1. ما هو الـ Module؟

**Module** = مجلد تحت `src/modules/<اسم_الميزة>/` يجمع كل ما يخص **ميزة واحدة** (مثل `user`, `trainer`, `workout`).

**الفائدة:**

- تلاقي كل شيء متعلق بالمستخدم في `modules/user` بدل تشتيت الملفات حسب النوع فقط (كل الـ controllers في مكان واحد ضخم).
- عند إضافة ميزة جديدة، تنسخ نفس الهيكل وتبني عليه.

**ربط الـ Module بالتطبيق:** في `src/app.js` يتم تحميل راوتر الميزة وربطه ببادئة مسار، مثال:

```text
app.use('/api/user', userRoutes);
```

أي مسار معرّف داخل `user.routes.js` يصبح تحت `/api/user/...`.

---

## 2. الطبقات داخل كل Module

| المجلد | الدور | ماذا يفعل وما لا يفعل |
|--------|--------|------------------------|
| **`routes/`** | نقطة الدخول للـ HTTP لهذه الميزة | يحدد المسار + الطريقة (`GET`, `POST`…) ويربط **middleware** (مثل التحقق من الجسم أو JWT) ثم **controller**. لا يضع منطق أعمال معقد هنا. |
| **`validators/`** | التحقق من شكل المدخلات | غالبًا **Joi schemas**: هل الحقول موجودة؟ أنواعها؟ قيم مسموحة؟ الطول؟ عند الفشل يُرمى `ValidationError` ويُعالجها `errorHandler` برد موحّد. |
| **`controller/`** | طبقة HTTP | يستقبل `req`, `res`, `next`. يستدعي **service**، يلف النتيجة بـ **`ApiResponse`**، أو يمرّر الخطأ بـ `next(err)`. لا يكتب استعلامات Prisma مباشرة عادةً. |
| **`service/`** | منطق الأعمال (Business logic) | قواعد المنتج: تسجيل، تسجيل دخول، تعارض إيميل، JWT، refresh، إلخ. يستدعي **repository** (وأحيانًا عدة repositories). |
| **`repository/`** | الوصول للداتابيز | دوال رفيعة: `findByEmail`, `createUser`, إلخ. تستخدم **Prisma** من `src/config/prisma.js`. لا تحتوي عادةً على قواعد “منتج” معقدة. |
| **`model/`** | اختياري / توسعة | مع **Prisma**، تعريف الجداول الحقيقي في **`prisma/schema.prisma`**. مجلد `model/` يمكن استخدامه لاحقًا لـ DTOs، أو mappers، أو ملفات تكميلية إن احتجت. |

**ملخص التسلسل النموذجي:**

```text
HTTP Request
  → routes (اختياري: validate → auth)
    → controller
      → service
        → repository → Prisma → PostgreSQL
      ← service
    ← controller (ApiResponse أو next(err))
  ← HTTP Response
```

---

## 3. مكونات مشتركة خارج الـ Module

| الملف / المجلد | الدور |
|----------------|--------|
| `src/app.js` | إنشاء تطبيق Express، `express.json()`, ربط كل الـ modules، ثم `notFound` ثم `errorHandler`. |
| `src/server.js` | استماع على المنفذ (فصل عن تعريف التطبيق). |
| `src/middleware/validate.js` | يطبّق Joi schema على `req.body`. |
| `src/middleware/auth.js` | يقرأ `Authorization: Bearer <JWT>`، يتحقق، يضع `req.user`. |
| `src/middleware/errorHandler.js` | يحوّل الأخطاء لرد JSON موحّد (`ValidationError`, `AppError`, أخطاء غير متوقعة). |
| `src/middleware/notFound.js` | أي مسار غير معرّف → 404. |
| `src/utils/apiResponse.js` | `success`, `created`, `error`, إلخ. |
| `prisma/schema.prisma` | نماذج قاعدة البيانات والعلاقات. |

---

## 4. Flow عام: من الطلب حتى الرد

1. الطلب يصل إلى Express.
2. `express.json()` يملأ `req.body`.
3. يُطابق المسار مع **route** في أحد الـ modules (حسب البادئة في `app.js`).
4. تُنفَّذ **middleware** بالترتيب (مثلاً `validate` ثم `auth`).
5. يُستدعى **controller**.
6. الـ controller يستدعي **service**.
7. الـ service يستدعي **repository** عند الحاجة للداتابيز.
8. النتيجة ترجع للـ controller → **`ApiResponse`**.
9. إذا حدث خطأ: `next(err)` → **`errorHandler`** يرسل status ورسالة مناسبة.

---

## 5. Feature: User / Auth — تدفقات تفصيلية

البادئة: **`/api/user`** (من `app.js`).

الملفات الأساسية:

| الملف |
|--------|
| `src/modules/user/routes/user.routes.js` |
| `src/modules/user/validators/auth.schemas.js` |
| `src/modules/user/controller/auth.controller.js` |
| `src/modules/user/controller/me.controller.js` |
| `src/modules/user/service/auth.service.js` |
| `src/modules/user/repository/user.repository.js` |
| `src/modules/user/repository/session.repository.js` |
| `src/middleware/auth.js` |

### 5.1 `POST /api/user/auth/register` — تسجيل حساب

| الخطوة | ماذا يحدث |
|--------|-----------|
| 1 | `user.routes.js`: المسار `/auth/register` + `validate(registerSchema)` + `authController.register`. |
| 2 | `validate`: Joi يفحص `firstName`, `lastName`, `email`, `password`, `gender`, `birthDate` (صيغة ISO للتاريخ). فشل → `ValidationError` → `errorHandler` (400 + `errors`). |
| 3 | `auth.controller.register` يستدعي `auth.service.register(req.body)`. |
| 4 | `auth.service.register`: يتحقق عبر `user.repository.findByEmail` إن الإيميل غير مستخدم؛ إن كان مستخدمًا → `AppError` 409. |
| 5 | يُشفَّر `password` بـ **bcrypt** → `passwordHash`. |
| 6 | `user.repository.createUser` ينشئ صفًا في جدول `User` (Prisma) مع `role` افتراضي `USER`. |
| 7 | `issueTokens`: توليد **access JWT** + **refresh token** عشوائي؛ hash الـ refresh يُخزَّن في `UserSession` عبر `session.repository.createSession`. |
| 8 | الـ controller يرجع `ApiResponse.created` مع `user` (مُصفّى بدون كلمة سر), `accessToken`, `refreshToken`. |

### 5.2 `POST /api/user/auth/login` — تسجيل الدخول

| الخطوة | ماذا يحدث |
|--------|-----------|
| 1 | `validate(loginSchema)` على `email`, `password`. |
| 2 | `auth.service.login`: `findByEmail`؛ إن لم يوجد مستخدم أو كلمة السر غير صحيحة → `UnauthorizedError` (رسالة عامة لتقليل تسريب معلومات). |
| 3 | عند النجاح: نفس فكرة `issueTokens` (جلسة refresh جديدة في DB). |
| 4 | `ApiResponse.success` مع `user`, `accessToken`, `refreshToken`. |

### 5.3 `POST /api/user/auth/refresh` — تجديد التوكنات

| الخطوة | ماذا يحدث |
|--------|-----------|
| 1 | `validate(refreshSchema)` يتطلب `refreshToken` في الـ body. |
| 2 | `auth.service.refresh`: يحسب hash للـ refresh token، يبحث عن جلسة نشطة غير منتهية وغير ملغاة في `UserSession`. |
| 3 | إن لم توجد → `UnauthorizedError`. |
| 4 | يجلب المستخدم بـ `findById`؛ إن لم يوجد → `UnauthorizedError`. |
| 5 | **Rotation**: إلغاء الجلسة القديمة (`revokeSessionByHash`) ثم إنشاء جلسة جديدة + access JWT جديد عبر `issueTokens`. |
| 6 | الرد يحتوي `user`, `accessToken`, `refreshToken` (الجديد). |

### 5.4 `POST /api/user/auth/logout` — تسجيل الخروج

| الخطوة | ماذا يحدث |
|--------|-----------|
| 1 | نفس `refreshSchema` في الـ body. |
| 2 | `auth.service.logout`: hash للـ token ثم `revokeSessionByHash` (تعيين `revokedAt`). |
| 3 | `ApiResponse.success` برسالة نجاح؛ لا حاجة لـ access token هنا إن أرسلت refresh صالح. |

### 5.5 `GET /api/user/me` — الملف الشخصي للمستخدم الحالي

| الخطوة | ماذا يحدث |
|--------|-----------|
| 1 | **لا** يوجد `validate` للـ body؛ يوجد middleware **`auth`** قبل `meController.me`. |
| 2 | `auth.js`: قراءة `Authorization: Bearer <accessToken>`، التحقق بـ `JWT_SECRET`، تعبئة `req.user` (مثل `id`, `role`). فشل أو انتهاء → `UnauthorizedError`. |
| 3 | `me.controller.me`: يقرأ `req.user.id`, يستدعي `user.repository.findById`. |
| 4 | إن لم يوجد المستخدم → خطأ 404 منطقي. |
| 5 | `ApiResponse.success` مع `user` مُصفّى (بدون `passwordHash`). |

---

## 6. الميزات الأخرى (Trainer, Admin, Workout, …)

حاليًا معظمها تحتوي على **راوتر فارغ** أو TODO. عند بناء ميزة جديدة:

1. عرّف المسارات في `modules/<feature>/routes/...`.
2. أضف الـ validators إن وُجدت مدخلات.
3. أنشئ controller → service → repository.
4. عدّل `prisma/schema.prisma` إن احتجت جداول جديدة ثم `npx prisma migrate dev`.
5. اربط الراوتر في `src/app.js` ببادئة `/api/...` واضحة.

---

## 7. ربط سريع بالملفات

```text
src/app.js                          → ربط كل الـ API prefixes
src/modules/<feature>/routes/       → تعريف المسارات والـ middleware لكل مسار
src/modules/<feature>/validators/   → Joi
src/modules/<feature>/controller/   → req/res + ApiResponse
src/modules/<feature>/service/      → منطق الأعمال
src/modules/<feature>/repository/   → Prisma
prisma/schema.prisma                → نماذج DB
docs/AUTH.md                         → تفاصيل إضافية عن المصادقة والبيئة
```

---

## 8. خلاصة جملة واحدة

**Module** يجمع ميزة واحدة؛ **routes** توجه الطلب؛ **validators** تضمن صحة المدخلات؛ **controller** يترجم HTTP؛ **service** يطبّق القواعد؛ **repository** يتحدث مع قاعدة البيانات؛ و**Prisma schema** هو مصدر حقيقة هيكل البيانات.
