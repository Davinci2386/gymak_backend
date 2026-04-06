# توثيق نظام المصادقة (Authentication)

هذا الملف يشرح مسارات الـ Auth، شكل الطلبات والاستجابات، متغيرات البيئة، وكيف تعدّل حقول المستخدم لاحقًا.

## المسار الأساسي

كل مسارات المستخدم (بما فيها Auth) مربوطة تحت:

- **`/api/user`**

في `src/app.js` يتم تحميل الراوتر عبر `app.use('/api/user', userRoutes)`.

---

## المتغيرات البيئية

| المتغير | الوصف |
|---------|--------|
| `JWT_SECRET` | مفتاح توقيع الـ Access Token (إلزامي). غيّره في الإنتاج لقيمة عشوائية قوية. |
| `JWT_EXPIRES_IN` | مدة صلاحية الـ Access Token (مثال: `1h`, `15m`). الافتراضي في الكود: `1h`. |
| `DATABASE_URL` | اتصال PostgreSQL لـ Prisma. |

عند التشغيل بـ **Docker Compose**، عرّف `JWT_SECRET` و`JWT_EXPIRES_IN` ضمن `environment` لخدمة `app` في `docker-compose.yml` (الكونتينر لا يعتمد على `.env` المحلي تلقائيًا إلا إذا ربطته صراحة).

---

## نموذج الاستجابة الموحّد

الاستجابات تتبع `ApiResponse`:

- **نجاح**: `success`, `statusCode`, `message`, `data` (وأحيانًا `pagination`).
- **خطأ**: `success: false`, `statusCode`, `message`, `data: null` (وقد يوجد `errors` عند أخطاء التحقق).

---

## الـ Access Token و الـ Refresh Token

- **Access Token**: JWT يُرسل في الطلبات المحمية.
  - الهيدر: `Authorization: Bearer <accessToken>`
  - الحمولة تحتوي `role` و`sub` (معرف المستخدم).
  - المدة: من `JWT_EXPIRES_IN` (افتراضيًا ساعة واحدة).

- **Refresh Token**: سلسلة عشوائية (opaque) تُرجع في JSON عند التسجيل/الدخول وعند التحديث.
  - **لا يُخزَّن نصًا** في قاعدة البيانات؛ يُخزَّن **SHA-256 hash** في جدول `UserSession`.
  - صلاحية الجلسة في الكود الحالي: **30 يومًا** من تاريخ الإصدار (`auth.service.js` → `refreshTokenExpiresAt(30)`).
  - عند **`/auth/refresh`**: يتم **إلغاء** الجلسة القديمة وإنشاء جلسة جديدة (rotation).

---

## المسارات (Endpoints)

| الطريقة | المسار الكامل | الوصف |
|---------|----------------|--------|
| `POST` | `/api/user/auth/register` | إنشاء حساب مستخدم (`role` يُضبط كـ `USER`). |
| `POST` | `/api/user/auth/login` | تسجيل الدخول. |
| `POST` | `/api/user/auth/refresh` | إصدار access + refresh جديدين باستخدام refresh token صالح. |
| `POST` | `/api/user/auth/logout` | إلغاء الجلسة المرتبطة بـ refresh token المُرسل. |
| `GET` | `/api/user/me` | بيانات المستخدم الحالي (يتطلب Access Token). |

### تسجيل حساب — `POST /api/user/auth/register`

**Body (JSON):**

| الحقل | نوع | ملاحظات |
|-------|-----|---------|
| `firstName` | string | مطلوب، طول 2–50 |
| `lastName` | string | مطلوب، طول 2–50 |
| `email` | string | بريد صالح، فريد |
| `password` | string | مطلوب، 8–128 حرف |
| `gender` | string | `MALE` أو `FEMALE` |
| `birthDate` | string (ISO 8601) | مثال: `"2000-01-01"` أو `"2000-01-01T00:00:00.000Z"` |

**استجابة ناجحة (مثال للحقول المهمة في `data`):**

- `user`: بيانات المستخدم بدون كلمة المرور
- `accessToken`
- `refreshToken`

### تسجيل الدخول — `POST /api/user/auth/login`

**Body:**

- `email`
- `password`

**استجابة:** مثل التسجيل (`user`, `accessToken`, `refreshToken`).

### تحديث التوكن — `POST /api/user/auth/refresh`

**Body:**

```json
{
  "refreshToken": "<القيمة التي حصلت عليها من register أو login أو من آخر refresh>"
```

**استجابة:** `user`, `accessToken`, `refreshToken` (جديدان؛ القديم يُلغى).

### تسجيل الخروج — `POST /api/user/auth/logout`

نفس body مثل الـ refresh. يُلغى السجل في `UserSession` المطابق للـ hash.

### الملف الشخصي — `GET /api/user/me`

**Headers:**

```
Authorization: Bearer <accessToken>
```

**استجابة:** `data.user` (نفس الحقول المعروضة للعميل بدون `passwordHash`).

---

## الملفات المرتبطة بالـ Auth

| الملف | الدور |
|-------|--------|
| `prisma/schema.prisma` | نماذج `User`, `UserSession` والـ enums |
| `src/modules/user/routes/user.routes.js` | تعريف المسارات |
| `src/modules/user/validators/auth.schemas.js` | تحقق Joi للـ body |
| `src/modules/user/service/auth.service.js` | تسجيل، دخول، JWT، refresh، logout |
| `src/modules/user/repository/user.repository.js` | استعلامات المستخدم |
| `src/modules/user/repository/session.repository.js` | جلسات الـ refresh |
| `src/modules/user/controller/auth.controller.js` | الاستجابات الموحّدة |
| `src/modules/user/controller/me.controller.js` | `/me` |
| `src/middleware/auth.js` | التحقق من Bearer JWT ووضع `req.user` |
| `src/config/env.js` | قراءة `JWT_SECRET`, `JWT_EXPIRES_IN` |

---

## كيف تعدّل حقول المستخدم (إضافة / تغيير / جعل حقل اختياري)

1. **`prisma/schema.prisma`**  
   عدّل `model User` (أو أضف جدولًا مرتبطًا مثل `Profile` إذا بدك فصلًا).

2. **Migration** (بعد تشغيل PostgreSQL):

   ```bash
   npx prisma migrate dev --name وصف_التغيير
   ```

   هذا يحدّث الجداول ويُحدّث مجلد `prisma/migrations/`.

3. **`src/modules/user/validators/auth.schemas.js`**  
   حدّث `registerSchema` (وأي schema آخر يتأثر) ليطابق الحقول الجديدة (إجباري / اختياري، قيم مسموحة، طول، إلخ).

4. **`src/modules/user/service/auth.service.js`**  
   في `register` (و`createUser` إن لزم)، مرّر الحقول الجديدة إلى `userRepo.createUser({ ... })`.

5. **`src/modules/user/controller/auth.controller.js`**  
   عدّل `sanitizeUser` إذا بدك تعرض حقلًا جديدًا للعميل أو تخفيه.

6. **إن أضفت endpoint لتحديث البروفايل** لاحقًا: أضف route + validator + service + repository بنفس النمط.

**ملاحظة:** إذا جعلت حقلًا كان إجباريًا **اختياريًا**، الـ migration عادةً سهل. إذا جعلت حقلًا اختياريًا **إجباريًا** ولديك صفوف قديمة بقيم `NULL`، قد تحتاج migration بخطوتين أو تعبئة بيانات (backfill) قبل فرض `NOT NULL`.

7. **Docker**  
   بعد تغيير الـ schema أو الكود، أعد بناء صورة التطبيق (انظر الأوامر أدناه) حتى يتضمّن `prisma generate` والكود الجديد.

---

## أوامر إعادة بناء Docker (نفّذها أنت)

من جذر المشروع `workout_backend` (PowerShell):

```powershell
cd C:\Users\Karam\Desktop\Work\workout_backend
```

إيقاف الحاويات:

```powershell
docker compose down
```

إعادة بناء الصور بدون كاش ثم التشغيل:

```powershell
docker compose build --no-cache
docker compose up -d
```

للتأكد:

```powershell
docker compose ps
docker compose logs --tail 50 app
```

**مهم:** إذا أضفت migrations جديدة على جهازك، تأكد أن قاعدة البيانات داخل Docker محدّثة. إمّا تشغّل `npx prisma migrate deploy` ضد `DATABASE_URL` الخاص بالـ host (نفس المنفذ 5432)، أو تنفّذ المهاجرات من داخل حاوية مؤقتة متصلة بنفس الشبكة—حسب طريقة عملك. للتطوير المحلي الأبسط: شغّل `docker compose up -d` للـ postgres فقط، ثم من الجهاز:

```powershell
npx prisma migrate dev
```

ثم ابنِ صورة التطبيق كما فوق.
