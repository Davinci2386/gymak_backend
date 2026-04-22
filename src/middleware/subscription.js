const { PrismaClient } = require('../generated/prisma');
const { APIError } = require('../utils');

const prisma = new PrismaClient();

/**
 * Check if user has active subscription
 * Middleware to protect premium features
 * 
 * Usage: router.get('/premium', auth, checkActiveSubscription, controller)
 */
const checkActiveSubscription = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }, // Not expired
      },
      include: { plan: true },
    });

    if (!subscription) {
      throw new APIError(
        'Active subscription required to access this feature',
        403
      );
    }

    // Attach subscription to request for use in controller
    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check if user has specific subscription plan
 * @param {string} planName - The plan name to check for
 * 
 * Usage: router.get('/elite', auth, checkSubscriptionPlan('Elite'), controller)
 */
const checkSubscriptionPlan = (planName) => {
  return async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gt: new Date() },
          plan: { name: planName },
        },
        include: { plan: true },
      });

      if (!subscription) {
        throw new APIError(
          `${planName} subscription required to access this feature`,
          403
        );
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

module.exports = {
  checkActiveSubscription,
  checkSubscriptionPlan,
};
