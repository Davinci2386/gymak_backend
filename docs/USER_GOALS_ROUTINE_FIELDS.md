# User Goals/Routine Fields

تمت إضافة الحقول التالية على جدول `User`:

- `goals`: مصفوفة نصوص (`String[]`) مع قيمة افتراضية `[]`
- `hasRoutine`: بولياني (`Boolean`) مع قيمة افتراضية `false`
- `trainTime`: نص اختياري (`String?`) يمثل وقت التمرين بصيغة `HH:mm`

## أين تظهر الحقول

الحقول تظهر الآن ضمن كائن المستخدم في الردود التالية:

- `POST /api/user/auth/register`
- `POST /api/user/auth/login`
- `POST /api/user/auth/refresh`
- `GET /api/user/me`

## الإدخال أثناء التسجيل

Endpoint: `POST /api/user/auth/register`

حقول إضافية مدعومة:

```json
{
  "goals": ["lose weight", "build muscle"],
  "hasRoutine": true,
  "trainTime": "18:30"
}
```

## قواعد التحقق

- `goals`: مصفوفة نصوص غير فارغة للعناصر (يمكن تركها فارغة كمصفوفة)
- `hasRoutine`: قيمة `true/false`
- `trainTime`: صيغة 24 ساعة `HH:mm` (مثل `06:00`, `18:30`)

## المايجريشن

تم إنشاء migration:

- `prisma/migrations/20260517192206_add_user_goals_routine_train_time/migration.sql`
