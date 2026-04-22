const { PrismaClient } = require('../../../generated/prisma');
const stripeService = require('./stripe.service');
const prisma = new PrismaClient();

/**
 * Create payment record and return payment intent for frontend
 */
const createPayment = async (paymentData) => {
  const { userId, planId, email } = paymentData;

  // Get subscription plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (!plan.isActive) {
    throw new Error('Subscription plan is not available');
  }

  // Create payment record in database
  const payment = await prisma.payment.create({
    data: {
      userId,
      planId,
      amount: plan.price,
      status: 'PENDING',
      currency: 'USD',
    },
  });

  try {
    // Create Stripe Payment Intent
    const stripePayment = await stripeService.createPaymentIntent({
      amount: plan.price,
      email,
      userId,
      planId,
    });

    // Update payment with Stripe ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripePaymentIntentId: stripePayment.paymentIntentId,
      },
    });

    return {
      paymentId: payment.id,
      clientSecret: stripePayment.clientSecret,
      amount: plan.price,
      planName: plan.name,
      durationDays: plan.durationDays,
    };
  } catch (error) {
    // Mark payment as failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
};

/**
 * Handle Stripe payment success from webhook
 */
const handlePaymentSuccess = async (paymentData) => {
  const { paymentIntentId, chargeId, amount } = paymentData;

  // Find payment by Stripe ID
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { user: true, plan: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Verify amount matches
  if (payment.amount !== amount) {
    throw new Error('Payment amount mismatch');
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      stripeChargeId: chargeId,
    },
    include: { plan: true, user: true },
  });

  return {
    payment: updatedPayment,
    user: payment.user,
    plan: payment.plan,
  };
};

/**
 * Get payment history for user
 */
const getUserPaymentHistory = async (userId) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      plan: true,
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments.map((payment) => ({
    id: payment.id,
    planName: payment.plan.name,
    amount: `$${(payment.amount / 100).toFixed(2)}`,
    status: payment.status,
    date: payment.createdAt.toISOString().split('T')[0],
    subscriptionId: payment.subscription?.id || null,
  }));
};

/**
 * Refund payment (for admin)
 */
const refundPayment = async (paymentId) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'COMPLETED') {
    throw new Error('Only completed payments can be refunded');
  }

  if (!payment.stripeChargeId) {
    throw new Error('No Stripe charge ID found');
  }

  try {
    // Refund with Stripe
    await stripeService.refundCharge(payment.stripeChargeId);

    // Update payment status
    const refundedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
      include: { subscription: true },
    });

    // Cancel subscription if exists
    if (refundedPayment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: refundedPayment.subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    }

    return refundedPayment;
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
};

module.exports = {
  createPayment,
  handlePaymentSuccess,
  getUserPaymentHistory,
  refundPayment,
};
