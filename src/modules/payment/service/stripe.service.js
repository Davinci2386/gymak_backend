const stripe = require('stripe');
const env = require('../../../config/env');

const stripeClient = stripe(env.STRIPE_SECRET_KEY);

/**
 * Create Payment Intent for subscription purchase
 * @param {Object} paymentData - { userId, planId, amount, email }
 * @returns {Object} - Stripe PaymentIntent
 */
const createPaymentIntent = async (paymentData) => {
  const { amount, email, userId, planId } = paymentData;

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(
      {
        amount: amount, // بـ cents
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: email,
        // metadata بتساعدنا نتابع الـ payment
        metadata: {
          userId,
          planId,
          type: 'subscription',
        },
      },
      {
        // Idempotency key prevents duplicate charges if request fails and retries
        idempotencyKey: `payment-${userId}-${planId}-${new Date().getTime()}`,
      }
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    throw new Error(`Stripe Payment Intent Error: ${error.message}`);
  }
};

/**
 * Retrieve Payment Intent status
 * @param {string} paymentIntentId
 * @returns {Object} - Stripe PaymentIntent details
 */
const getPaymentIntentStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      chargeId: paymentIntent.charges.data[0]?.id || null,
    };
  } catch (error) {
    throw new Error(`Stripe Retrieve Error: ${error.message}`);
  }
};

/**
 * Verify Webhook Signature (Security Check)
 * @param {Buffer} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} - Parsed event
 */
const verifyWebhookSignature = (body, signature) => {
  try {
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    throw new Error(`Webhook Signature Verification Failed: ${error.message}`);
  }
};

/**
 * Create Stripe Customer (للاستخدام المستقبلي)
 * @param {Object} customerData - { email, name }
 * @returns {string} - Stripe Customer ID
 */
const createCustomer = async (customerData) => {
  try {
    const customer = await stripeClient.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: {
        userId: customerData.userId,
      },
    });
    return customer.id;
  } catch (error) {
    throw new Error(`Stripe Customer Creation Error: ${error.message}`);
  }
};

/**
 * Refund a charge
 * @param {string} chargeId
 * @returns {Object} - Refund details
 */
const refundCharge = async (chargeId) => {
  try {
    const refund = await stripeClient.refunds.create({
      charge: chargeId,
    });
    return refund;
  } catch (error) {
    throw new Error(`Stripe Refund Error: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntentStatus,
  verifyWebhookSignature,
  createCustomer,
  refundCharge,
};
