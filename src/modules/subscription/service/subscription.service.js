const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

/**
 * Create subscription plan (Admin only)
 */
const createSubscriptionPlan = async (planData) => {
  const { name, description, price, durationDays, features } = planData;

  // Check if plan already exists
  const existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { name },
  });

  if (existingPlan) {
    throw new Error('Subscription plan already exists');
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name,
      description,
      price,
      durationDays,
      features: features || [],
      isActive: true,
    },
  });

  return plan;
};

/**
 * Update subscription plan (Admin only)
 */
const updateSubscriptionPlan = async (planId, updateData) => {
  const { name, description, price, durationDays, features, isActive } = updateData;

  // Check if plan exists
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // If changing name, check for conflicts
  if (name && name !== plan.name) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { name },
    });
    if (existingPlan) {
      throw new Error('Subscription plan name already exists');
    }
  }

  const updatedPlan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(durationDays && { durationDays }),
      ...(features && { features }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return updatedPlan;
};

/**
 * Get all active subscription plans (for users)
 */
const getActiveSubscriptionPlans = async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price, // بـ cents
    priceFormatted: `$${(plan.price / 100).toFixed(2)}`,
    durationDays: plan.durationDays,
    features: plan.features || [],
  }));
};

/**
 * Get subscription plan by ID
 */
const getSubscriptionPlan = async (planId) => {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  return plan;
};

/**
 * Create subscription for user after successful payment
 */
const createSubscription = async (subscriptionData) => {
  const { userId, planId, paymentId } = subscriptionData;

  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // Calculate end date based on duration
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // Check if user already has active subscription for this plan
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      planId,
      status: 'ACTIVE',
    },
  });

  if (existingSubscription) {
    // Extend existing subscription
    const extendedEndDate = new Date(existingSubscription.endDate);
    extendedEndDate.setDate(extendedEndDate.getDate() + plan.durationDays);

    const updatedSub = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: { endDate: extendedEndDate },
      include: { plan: true, user: { select: { email: true, firstName: true } } },
    });

    // Create payment record
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          subscriptionId: existingSubscription.id,
          status: 'COMPLETED',
        },
      });
    }

    return updatedSub;
  }

  // Create new subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      startDate,
      endDate,
      status: 'ACTIVE',
    },
    include: {
      plan: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  // Update payment record with subscription ID
  if (paymentId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        subscriptionId: subscription.id,
        status: 'COMPLETED',
      },
    });
  }

  return subscription;
};

/**
 * Get user's active subscription
 */
const getUserActiveSubscription = async (userId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gt: new Date() }, // Not expired
    },
    include: {
      plan: true,
    },
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    daysRemaining: Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)),
  };
};

/**
 * Cancel user subscription
 */
const cancelSubscription = async (userId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  const cancelledSubscription = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
    include: { plan: true },
  });

  return cancelledSubscription;
};

/**
 * Update subscription status to EXPIRED (Cron job or scheduled task)
 */
const expireSubscriptions = async () => {
  const now = new Date();

  const expired = await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return expired;
};

module.exports = {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getActiveSubscriptionPlans,
  getSubscriptionPlan,
  createSubscription,
  getUserActiveSubscription,
  cancelSubscription,
  expireSubscriptions,
};
