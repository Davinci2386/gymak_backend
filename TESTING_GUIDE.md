# 🧪 Stripe Integration - Testing Guide

## 1️⃣ Local Testing with Stripe Test Mode

### Stripe Test Cards
```
💳 SUCCESSFUL CHARGE
Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123

❌ FAILED CHARGE
Number: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123

💬 3D SECURE REQUIRED
Number: 4000 0025 0000 3155
Expiry: 12/25
CVC: 123
```

---

## 2️⃣ API Flow - cURL Examples

### Step 1: List Available Plans
```bash
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json"

# Expected Response:
# [
#   {
#     id: "plan_xxx",
#     name: "Pro",
#     price: 99900,
#     priceFormatted: "$999.00",
#     durationDays: 365,
#     features: [...]
#   }
# ]
```

### Step 2: Admin Creates a Plan (First Time)
```bash
curl -X POST http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Pro Annual",
    "description": "One year premium access",
    "price": 99900,
    "durationDays": 365,
    "features": ["Advanced Workouts", "AI Coaching", "Premium Support"]
  }'
```

### Step 3: User Initiates Payment
```bash
curl -X POST http://localhost:3000/api/subscriptions/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "planId": "plan_xxx"
  }'

# Expected Response:
# {
#   success: true,
#   data: {
#     paymentId: "pay_xxx",
#     clientSecret: "pi_xxx_secret_yyy",
#     amount: 99900,
#     planName: "Pro Annual",
#     durationDays: 365
#   }
# }
```

### Step 4: Payment Processing (Frontend)
```javascript
// From frontend with Stripe.js
const { clientSecret } = paymentData;

const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    type: 'card',
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 25,
      cvc: '123'
    }
  }
});

if (result.paymentIntent.status === 'succeeded') {
  // Payment successful! 
  // Webhook will create subscription automatically
}
```

### Step 5: Verify Payment Success
```bash
curl -X GET http://localhost:3000/api/payments/history \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Expected Response:
# [
#   {
#     id: "pay_xxx",
#     planName: "Pro Annual",
#     amount: "$999.00",
#     status: "COMPLETED",
#     date: "2026-04-20"
#   }
# ]
```

### Step 6: Check Current Subscription
```bash
curl -X GET http://localhost:3000/api/subscriptions/me \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Expected Response:
# {
#   success: true,
#   data: {
#     id: "sub_xxx",
#     plan: {
#       name: "Pro Annual",
#       features: [...]
#     },
#     startDate: "2026-04-20",
#     endDate: "2027-04-20",
#     daysRemaining: 365
#   }
# }
```

---

## 3️⃣ Webhook Testing

### Using Stripe CLI (Local)
```bash
# 1. Install Stripe CLI from https://stripe.com/docs/stripe-cli

# 2. Login to your Stripe account
stripe login

# 3. Forward webhook events to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# 4. Trigger test event
stripe trigger payment_intent.succeeded

# Check logs in your terminal for webhook results
```

### Manual Webhook Testing with ngrok
```bash
# 1. Start ngrok
ngrok http 3000

# 2. Get your ngrok URL (e.g., https://abc123.ngrok.io)

# 3. Add to Stripe Dashboard:
# - Webhook URL: https://abc123.ngrok.io/api/payments/webhook
# - Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

# 4. Test webhooks from Stripe Dashboard
# - Go to Developers → Webhooks → Test webhook
# - Send "payment_intent.succeeded" event
```

---

## 4️⃣ Docker Integration Testing

### Run Full Stack
```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Expected startup logs:
# Server is running on port 3000
# ✅ Subscription maintenance tasks started
```

### Test Database Migrations
```bash
# Connect to database
docker exec -it workout_postgres psql -U workout_user -d workout_db

# List tables
\dt

# Expected tables:
# - public | SubscriptionPlan
# - public | Subscription
# - public | Payment
```

---

## 5️⃣ End-to-End Test Scenario

### Complete Flow:

```bash
# 1. Get all plans
PLANS=$(curl -s http://localhost:3000/api/subscriptions/plans)
PLAN_ID=$(echo $PLANS | jq -r '.[0].id')
echo "Selected plan: $PLAN_ID"

# 2. Create payment intent
PAYMENT=$(curl -s -X POST http://localhost:3000/api/subscriptions/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"planId\": \"$PLAN_ID\"}")

PAYMENT_ID=$(echo $PAYMENT | jq -r '.data.paymentId')
CLIENT_SECRET=$(echo $PAYMENT | jq -r '.data.clientSecret')
echo "Payment Intent ID: $PAYMENT_ID"

# 3. Simulate Stripe webhook (use Stripe CLI: stripe trigger payment_intent.succeeded)

# 4. Verify subscription created
curl -s http://localhost:3000/api/subscriptions/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq

# 5. Verify payment recorded
curl -s http://localhost:3000/api/payments/history \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

---

## 6️⃣ Common Issues & Debugging

### Issue: "Invalid Stripe signature"
**Cause:** Webhook secret mismatch
**Solution:**
```bash
# Verify in docker-compose.yml:
STRIPE_WEBHOOK_SECRET: whsec_... (must match Stripe dashboard)
```

### Issue: "Payment amount mismatch"
**Cause:** Subscription plan price changed between payment creation and completion
**Solution:** Don't change plan prices while payments are pending

### Issue: "No charge found in payment intent"
**Cause:** Webhook received before charge settled
**Solution:** Stripe retries webhook; logs will show success eventually

### Issue: Subscription not created after payment
**Cause:** Webhook not received or verification failed
**Solution:**
```bash
# Check Docker logs:
docker-compose logs app | grep -i webhook

# Check payment status:
curl http://localhost:3000/api/payments/history
```

---

## 7️⃣ Database Inspection

### Check Payment Records
```sql
SELECT * FROM "Payment" ORDER BY "createdAt" DESC LIMIT 5;
```

### Check Subscriptions
```sql
SELECT 
  s.id, 
  s.status, 
  s."startDate", 
  s."endDate",
  sp.name as plan_name
FROM "Subscription" s
JOIN "SubscriptionPlan" sp ON s."planId" = sp.id
ORDER BY s."createdAt" DESC;
```

### Check Plan Prices
```sql
SELECT id, name, price, "durationDays", "isActive" FROM "SubscriptionPlan";
```

### Test Expiration Logic
```sql
-- Manually expire a subscription
UPDATE "Subscription" 
SET status = 'EXPIRED'
WHERE id = 'sub_xxx';

-- Or test automatic expiration (runs every hour)
-- Should see log: "✅ [Subscription Task] Expired X subscriptions"
```

---

## 8️⃣ Performance Testing

### Create Multiple Plans
```javascript
const plans = [
  { name: 'Starter', price: 4900, durationDays: 30 },
  { name: 'Pro', price: 9900, durationDays: 30 },
  { name: 'Elite', price: 29900, durationDays: 30 },
  { name: 'Startup', price: 99900, durationDays: 365 },
];

// Create via API
for (const plan of plans) {
  await fetch(`${API_URL}/api/subscriptions/plans`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ ADMIN_TOKEN}` },
    body: JSON.stringify(plan)
  });
}
```

### Create Test Users & Subscriptions
```bash
# Create bulk test data script
# src/scripts/testDataSeeder.js
```

---

## 9️⃣ Monitoring Stripe Events

### Dashboard Links
```
Stripe Test Dashboard:
https://dashboard.stripe.com/test/dashboard

Webhooks:
https://dashboard.stripe.com/test/webhooks

API Keys:
https://dashboard.stripe.com/test/apikeys

Payment Intents:
https://dashboard.stripe.com/test/payments?status[0]=open
```

---

## 🔟 Cleanup & Reset

### Reset Test Data
```bash
# Delete all subscriptions
DELETE FROM "Subscription";
DELETE FROM "Payment";

# Reset IDs
TRUNCATE TABLE "SubscriptionPlan" RESTART IDENTITY;

# Or use
docker-compose exec postgres psql -U workout_user -d workout_db -c "DELETE FROM \"Subscription\";"
```

### Full Database Reset
```bash
# Remove and recreate
docker-compose down -v
docker-compose up -d
```

---

## ✅ Ready for Production Checklist

- [ ] Test with staging Stripe account
- [ ] Verify all webhook events handled
- [ ] Load test payment endpoint
- [ ] Monitor Stripe API rate limits
- [ ] Set up error alerts/notifications
- [ ] Document customer support process
- [ ] Test refund process with customer
- [ ] Verify email receipts
- [ ] Check PCI compliance
- [ ] Set up billing audit logs
