const { Router } = require('express');
const paymentController = require('../controller/payment.controller');

const router = Router();

/**
 * Stripe Webhook - Must be raw body (not JSON parsed)
 * POST /api/payments/webhook
 * 
 * ⚠️ CRITICAL: This endpoint must receive raw body for signature verification
 * Configure middleware to skip JSON parsing for this route
 */
router.post('/webhook', paymentController.handleStripeWebhook);

module.exports = router;
