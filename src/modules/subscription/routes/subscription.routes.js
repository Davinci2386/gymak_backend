const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const {
  createPlanSchema,
  updatePlanSchema,
  createPaymentIntentSchema,
} = require('../validators/subscription.schemas');
const subscriptionController = require('../controller/subscription.controller');
const paymentController = require('../../payment/controller/payment.controller');

const router = Router();

// === Public Endpoints ===
// List all active subscription plans
router.get('/plans', subscriptionController.listPlans);

// === User Endpoints ===
// Get current user's subscription
router.get('/me', auth, subscriptionController.getMySubscription);

// Cancel subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

// Create payment intent for subscription purchase
router.post('/create-payment', auth, validate(createPaymentIntentSchema), paymentController.createPaymentIntent);

// Get payment history
router.get('/payments/history', auth, paymentController.getPaymentHistory);

// === Admin Endpoints ===
// Create new subscription plan
router.post(
  '/plans',
  auth,
  authorize('ADMIN'),
  validate(createPlanSchema),
  subscriptionController.createPlan
);

// Update subscription plan
router.put(
  '/plans/:planId',
  auth,
  authorize('ADMIN'),
  validate(updatePlanSchema),
  subscriptionController.updatePlan
);

// Refund payment (Admin only)
router.post(
  '/payments/:paymentId/refund',
  auth,
  authorize('ADMIN'),
  paymentController.refundPayment
);

module.exports = router;
