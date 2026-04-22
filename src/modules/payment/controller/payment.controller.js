const paymentService = require('../service/payment.service');
const subscriptionService = require('../../subscription/service/subscription.service');
const stripeService = require('../service/stripe.service');
const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();
const { ApiResponse, APIError } = require('../../../utils');

/**
 * Create payment intent for subscription purchase
 * POST /api/payments/create-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { id: userId, email } = req.user;
    const { planId } = req.body;

    if (!planId) {
      throw new APIError('planId is required', 400);
    }

    // Verify plan exists
    const plan = await subscriptionService.getSubscriptionPlan(planId);

    const paymentData = await paymentService.createPayment({
      userId,
      planId,
      email,
    });

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Payment intent created',
      data: paymentData,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

/**
 * Stripe Webhook Handler (Security Critical!)
 * POST /api/payments/webhook
 */
const handleStripeWebhook = async (req, res) => {
  try {
    // Important: Use raw body for signature verification
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      throw new APIError('Missing Stripe signature', 400);
    }

    let event;
    try {
      event = stripeService.verifyWebhookSignature(req.rawBody, signature);
    } catch (signatureError) {
      console.error('Webhook signature verification failed:', signatureError.message);
      throw new APIError('Invalid Stripe signature', 401);
    }

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of event
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(error.statusCode || 500).json({
      error: error.message,
    });
  }
};

/**
 * Handle payment_intent.succeeded event
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const { id: paymentIntentId, charges, amount_received, metadata } = paymentIntent;
    const chargeId = charges?.data[0]?.id;

    if (!chargeId) {
      console.warn('No charge found in payment intent:', paymentIntentId);
      return;
    }

    // Get payment record
    const paymentResult = await paymentService.handlePaymentSuccess({
      paymentIntentId,
      chargeId,
      amount: amount_received,
    });

    // Create subscription
    const subscription = await subscriptionService.createSubscription({
      userId: paymentResult.user.id,
      planId: paymentResult.plan.id,
      paymentId: paymentResult.payment.id,
    });

    console.log(`✅ Subscription created for user ${paymentResult.user.id} - Plan: ${paymentResult.plan.name}`);
    console.log(`📅 Active until: ${subscription.endDate.toLocaleDateString()}`);
  } catch (error) {
    console.error('Error handling payment success:', error.message);
    throw error;
  }
};

/**
 * Handle payment_intent.payment_failed event
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const { id: paymentIntentId, last_payment_error } = paymentIntent;

    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorMessage: last_payment_error?.message || 'Payment failed',
        },
      });
    }

    console.error(`❌ Payment failed: ${paymentIntentId} - ${last_payment_error?.message}`);
  } catch (error) {
    console.error('Error handling payment failure:', error.message);
  }
};

/**
 * Handle charge.refunded event
 */
const handleChargeRefunded = async (charge) => {
  try {
    const { id: chargeId } = charge;

    const payment = await prisma.payment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    if (payment) {
      // Cancel subscription
      if (payment.subscriptionId) {
        await subscriptionService.cancelSubscription(payment.userId);
      }

      console.log(`🔄 Charge refunded: ${chargeId} - Subscription cancelled`);
    }
  } catch (error) {
    console.error('Error handling refund:', error.message);
  }
};

/**
 * Get user's payment history
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const history = await paymentService.getUserPaymentHistory(userId);

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Payment history retrieved',
      data: history,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: 500,
      message: error.message,
    });
  }
};

/**
 * Refund payment (Admin only)
 * POST /api/payments/:paymentId/refund
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const refundedPayment = await paymentService.refundPayment(paymentId);

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Payment refunded successfully',
      data: refundedPayment,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
  handleStripeWebhook,
  getPaymentHistory,
  refundPayment,
};
