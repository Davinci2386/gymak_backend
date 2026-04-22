const subscriptionService = require('../service/subscription.service');
const { ApiResponse, APIError } = require('../../../utils');

/**
 * Create subscription plan (Admin only)
 * POST /api/subscriptions/plans
 */
const createPlan = async (req, res) => {
  try {
    const { name, description, price, durationDays, features } = req.body;

    if (!name || !price || !durationDays) {
      throw new APIError('Missing required fields', 400);
    }

    if (price < 100) {
      throw new APIError('Minimum price is $1.00 (100 cents)', 400);
    }

    if (durationDays < 1) {
      throw new APIError('Duration must be at least 1 day', 400);
    }

    const plan = await subscriptionService.createSubscriptionPlan({
      name,
      description,
      price,
      durationDays,
      features,
    });

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Subscription plan created successfully',
      data: plan,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

/**
 * Update subscription plan (Admin only)
 * PUT /api/subscriptions/plans/:planId
 */
const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    const plan = await subscriptionService.updateSubscriptionPlan(planId, updateData);

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Subscription plan updated successfully',
      data: plan,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

/**
 * Get all active subscription plans
 * GET /api/subscriptions/plans
 */
const listPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getActiveSubscriptionPlans();

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Subscription plans retrieved',
      data: plans,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: 500,
      message: error.message,
    });
  }
};

/**
 * Get user's active subscription
 * GET /api/subscriptions/me
 */
const getMySubscription = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const subscription = await subscriptionService.getUserActiveSubscription(userId);

    if (!subscription) {
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'No active subscription',
        data: null,
      });
    }

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Current subscription',
      data: subscription,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: 500,
      message: error.message,
    });
  }
};

/**
 * Cancel user's subscription
 * POST /api/subscriptions/cancel
 */
const cancelSubscription = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const subscription = await subscriptionService.cancelSubscription(userId);

    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    return ApiResponse.error(res, {
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

module.exports = {
  createPlan,
  updatePlan,
  listPlans,
  getMySubscription,
  cancelSubscription,
};
