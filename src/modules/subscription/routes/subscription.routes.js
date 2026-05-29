const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const {
  createPlanSchema,
  updatePlanSchema,
  createPaymentIntentSchema,
} = require('../validators/subscription.schemas');
const subscriptionController = require('../controller/subscription.controller');
const trainerRequestController = require('../controller/trainerRequest.controller');
const paymentController = require('../../payment/controller/payment.controller');
const { createRequestSchema } = require('../validators/trainerRequest.schemas');

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

// Request / assignment flow between players and trainers
router.post(
  '/trainer-requests',
  auth,
  authorize('USER'),
  validate(createRequestSchema),
  trainerRequestController.create
);
router.get('/trainer-requests/me', auth, authorize('USER'), trainerRequestController.myRequests);
router.post('/trainer-requests/:requestId/cancel', auth, authorize('USER'), trainerRequestController.cancel);
router.get('/trainer-requests/inbox', auth, authorize('TRAINER'), trainerRequestController.inbox);
router.post('/trainer-requests/:requestId/approve', auth, authorize('TRAINER'), trainerRequestController.approve);
router.post('/trainer-requests/:requestId/reject', auth, authorize('TRAINER'), trainerRequestController.reject);
router.get('/assignment/me', auth, authorize('USER'), trainerRequestController.myAssignment);

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
