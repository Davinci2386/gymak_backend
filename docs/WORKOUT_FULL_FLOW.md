# Workout Flow (Updated)

هذا التوثيق يشرح الفلو الكامل الحالي للتمارين بعد التعديل:

- كاتالوج التمارين أصبح **عام لكل الكوتشات**.
- الكاتالوج أصبح **مفصول عن منطق الأيام** (ما في Catalog Days).
- كل تمرين له قسم عضلي إجباري.

## 1) الأقسام العضلية المعتمدة

القيم المسموحة في `muscleGroup`:

- `BICEPS`
- `TRICEPS`
- `CHEST`
- `LEGS`
- `BACK`
- `SHOULDERS`
- `CARDIO`

## 2) فلو الإسناد (لاعب <-> كوتش)

### اللاعب يرسل طلب كوتش

- `POST /api/subscriptions/trainer-requests`
- Auth: `USER`

Body:

```json
{
  "trainerId": "<uuid>"
}
```

### الكوتش يوافق

- `POST /api/subscriptions/trainer-requests/:requestId/approve`
- Auth: `TRAINER`

النتيجة:

- إنهاء أي إسناد فعال سابق للاعب.
- إنشاء إسناد فعال جديد `TrainerAssignment(status=ACTIVE)`.

## 3) الوصول لخطة اللاعب

### اللاعب يقرأ خطته

- `GET /api/workouts/plan`
- Auth: `USER`
- Middleware: `requireActiveAssignment`

إذا ما في إسناد فعال، يرجع 403 برسالة واضحة حسب حالة آخر طلب.

### الكوتش يقرأ خطة لاعب معيّن

- `GET /api/workouts/players/:playerId/plan`
- Auth: `TRAINER`
- شرط: لازم اللاعب مخصص لنفس الكوتش.

## 4) إنشاء الخطة (أيام + تمارين)

### إضافة يوم

- `POST /api/workouts/players/:playerId/days`
- Auth: `TRAINER`

```json
{
  "dayNumber": 1,
  "label": "Upper Body"
}
```

### إضافة تمرين داخل يوم

- `POST /api/workouts/days/:dayId/exercises`
- Auth: `TRAINER`

```json
{
  "name": "Bench Press",
  "description": "4 sets x 8 reps",
  "imageUrls": ["https://.../bench.png"],
  "videoUrl": "https://.../bench.mp4",
  "muscleGroup": "CHEST",
  "sortOrder": 0
}
```

مهم:

- عند إنشاء التمرين داخل الخطة، يتم **إضافته تلقائيا للكاتالوج العام** (`WorkoutCatalogExercise`) ليظهر لكل الكوتشات.

### تعديل/حذف يوم

- `PUT /api/workouts/days/:dayId`
- `DELETE /api/workouts/days/:dayId`

### تعديل/حذف تمرين

- `PUT /api/workouts/exercises/:exerciseId`
- `DELETE /api/workouts/exercises/:exerciseId`

ملاحظة:

- تعديل التمرين داخل خطة اللاعب لا يحدّث نسخة الكاتالوج القديمة تلقائيا؛ الكاتالوج يحتفظ بعناصره كسجل عام مستقل.

## 5) الكاتالوج العام (منفصل عن الأيام)

الكاتالوج الآن يعتمد على جدول مستقل: `WorkoutCatalogExercise`.

### استعراض الكاتالوج

- `GET /api/workouts/catalog/exercises`
- Auth: `TRAINER`

فلترة حسب العضلة (اختياري):

- `GET /api/workouts/catalog/exercises?muscleGroup=CHEST`

### إضافة تمرين من الكاتالوج ليوم اللاعب

- `POST /api/workouts/days/:dayId/exercises/from-catalog`
- Auth: `TRAINER`

Body (الجديد):

```json
{
  "sourceCatalogExerciseId": "<uuid>",
  "sortOrder": 2
}
```

Body (مدعوم للتوافق):

```json
{
  "sourceExerciseId": "<uuid>",
  "sortOrder": 2
}
```

كلا الحقلين مقبولان، والهدف نفس الشيء: معرف تمرين من الكاتالوج العام.

## 6) ما تغيّر فعليا عن النسخة السابقة

- تم حذف كاتالوج الأيام من الفلو (ما عاد موجود endpoint `catalog/days`).
- تم إلغاء نسخ يوم كامل من الكاتالوج (`players/:playerId/days/from-catalog`).
- الكاتالوج لم يعد مشتق من تمارين الأيام؛ صار جدول مستقل عالمي.

## 7) سلوك البيانات القديمة

- التمارين القديمة في `WorkoutExercise` تم إعطاؤها `muscleGroup = CARDIO` افتراضيا عبر migration.

## 8) ملخص سريع

1. اللاعب يرسل طلب كوتش.
2. الكوتش يوافق -> ينشأ إسناد فعال.
3. الكوتش يبني أيام الخطة للاعب.
4. عند إضافة أي تمرين جديد، يضاف أيضًا تلقائيًا للكاتالوج العام.
5. أي كوتش يستطيع لاحقًا استخدام هذا التمرين عبر `from-catalog`.
