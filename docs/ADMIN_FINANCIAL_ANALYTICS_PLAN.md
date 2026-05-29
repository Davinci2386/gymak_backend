# Admin Financial Analytics Plan

هذا الملف هو مخطط أولي لإضافة لوحة إحصائيات مالية للأدمن في الـ API، مع قابلية توسعة مستقبلية.

## 1) الهدف

تقديم endpoints للأدمن تعرض:
- الدخل الشهري (Monthly Revenue)
- الميزانية/الرصيد المتوفر حاليًا (Available Balance)
- نمو التطبيق (Growth)
- زيادة عدد المستخدمين (User Growth)
- مؤشرات الاشتراكات والتحويل (Conversion/Retention)

## 2) المقاييس الأساسية (V1)

### 2.1 Monthly Revenue
- التعريف: مجموع المدفوعات `COMPLETED` خلال الشهر.
- المصدر: جدول `Payment`.
- المعادلة:
  - `monthlyRevenue = SUM(payment.amount WHERE status='COMPLETED' AND createdAt داخل الشهر)`

### 2.2 Available Balance
- التعريف: صافي المال المتاح بعد الخصومات (refunds).
- نسخة أولية (تقريبية):
  - `availableBalance = totalCompleted - totalRefunded`
- ملاحظة: إذا بدنا دقة محاسبية أعلى لاحقًا، نضيف tracking لرسوم Stripe وعمولات المنصة.

### 2.3 App Growth (Revenue Growth %)
- التعريف: نسبة نمو الدخل مقارنة بالشهر السابق.
- المعادلة:
  - `growthPercent = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100`
- حالة خاصة: إذا السابق = 0، نرجع `null` أو `100` حسب سياسة العرض.

### 2.4 User Growth
- التعريف: عدد المستخدمين الجدد في فترة محددة + نسبة التغيير عن الفترة السابقة.
- المصدر: `User.createdAt`.

### 2.5 Subscription KPIs
- Active Subscriptions
- New Subscriptions (ضمن الفترة)
- Cancelled Subscriptions (ضمن الفترة)
- Churn Rate (نسخة مبسطة)

## 3) ملاحظات مهمة على الداتا الحالية

- بما أنه صار عندنا "حذف حساب مع الحفاظ على المدفوعات"، لازم الإحصائيات تعتمد على:
  - `Payment` و `Subscription` مباشرة
  - وليس على وجود بيانات بروفايل كاملة للمستخدم
- هيك حتى لو الحساب "محذوف منطقيًا"، السجلات المالية تضل محسوبة.

## 4) API Proposal (V1)

كل endpoints أدناه تحت صلاحية `ADMIN` فقط.

### 4.1 Dashboard Summary
- `GET /api/admin/analytics/financial/summary?from=2026-01-01&to=2026-01-31`
- يرجع أرقام رئيسية للوحة.

### 4.2 Monthly Revenue Series
- `GET /api/admin/analytics/financial/revenue-series?months=12`
- يرجع سلسلة شهرية آخر 12 شهر.

### 4.3 User Growth Series
- `GET /api/admin/analytics/users/growth-series?months=12`

### 4.4 Subscription KPIs
- `GET /api/admin/analytics/subscriptions/kpis?from=2026-01-01&to=2026-01-31`

## 5) JSON Response Examples

### 5.1 Financial Summary Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Financial analytics summary",
  "data": {
    "range": {
      "from": "2026-01-01",
      "to": "2026-01-31"
    },
    "currency": "USD",
    "monthlyRevenue": 1254300,
    "monthlyRevenueFormatted": "$12,543.00",
    "previousMonthRevenue": 1032100,
    "growthPercent": 21.53,
    "totalCompletedRevenue": 6578900,
    "totalRefunded": 342000,
    "availableBalance": 6236900,
    "availableBalanceFormatted": "$62,369.00"
  }
}
```

### 5.2 Revenue Series Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Revenue series",
  "data": {
    "currency": "USD",
    "months": [
      { "month": "2025-11", "revenue": 825000, "revenueFormatted": "$8,250.00" },
      { "month": "2025-12", "revenue": 902400, "revenueFormatted": "$9,024.00" },
      { "month": "2026-01", "revenue": 1254300, "revenueFormatted": "$12,543.00" }
    ]
  }
}
```

### 5.3 User Growth Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User growth analytics",
  "data": {
    "range": {
      "from": "2026-01-01",
      "to": "2026-01-31"
    },
    "newUsers": 384,
    "previousPeriodNewUsers": 301,
    "growthPercent": 27.57,
    "totalUsers": 5410
  }
}
```

### 5.4 Subscription KPIs Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription KPIs",
  "data": {
    "activeSubscriptions": 972,
    "newSubscriptions": 143,
    "cancelledSubscriptions": 31,
    "expiredSubscriptions": 42,
    "churnRatePercent": 3.19,
    "conversionRatePercent": 6.84
  }
}
```

## 6) Query/Performance Notes

- يفضّل إضافة/تأكيد Indexes:
  - `Payment(status, createdAt)`
  - `Subscription(status, createdAt, endDate)`
  - `User(createdAt)`
- للتقارير الطويلة (12+ شهر) ممكن نضيف caching (Redis) لاحقًا.

## 7) Security

- جميع endpoints لازم تكون:
  - `auth`
  - `authorize('ADMIN')`
- عدم إرجاع بيانات حساسة للمستخدمين داخل analytics (PII).

## 8) خطة تنفيذ سريعة (Suggested)

1. بناء service جديد: `adminAnalytics.service.js`
2. إضافة controller + routes تحت `src/modules/admin`
3. إضافة validators للـ query params (`from`, `to`, `months`)
4. اختبار Postman + Unit tests لمعادلات النمو
5. توثيق endpoints في `docs/ADMIN.md`

## 9) قابلية التعديل والإضافة

الملف مقصود يكون قابل للتوسعة. ممكن نضيف لاحقًا:
- ARPU / LTV
- Cohort Retention
- Revenue by Plan
- Country/Region breakdown
- Net revenue after Stripe fees

