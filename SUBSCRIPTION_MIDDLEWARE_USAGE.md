/**
 * EXAMPLE: How to use Subscription Middleware
 * 
 * This file shows how to protect premium features behind a subscription requirement
 */

const { Router } = require('express');
const { auth, checkActiveSubscription, checkSubscriptionPlan } = require('../../../middleware');

const router = Router();

/**
 * Example 1: Multi-level exclusive content
 * Trainer can only access assignments if they have ACTIVE subscription
 */
router.get(
  '/trainer-exclusive-workouts',
  auth,
  checkActiveSubscription, // Checks if user has ANY active subscription
  async (req, res) => {
    // req.subscription is available here with plan details
    // req.subscription.plan.features contains array of features for this plan
    
    res.json({
      success: true,
      message: `🎯 Access granted with ${req.subscription.plan.name} subscription`,
      trainerData: {
        // Only trainers with subscription can see this data
      },
    });
  }
);

/**
 * Example 2: Specific plan requirement
 * Only "Premium" plan users can access elite features
 */
router.get(
  '/elite-coaching',
  auth,
  checkSubscriptionPlan('Premium'), // Specific plan check
  async (req, res) => {
    res.json({
      success: true,
      message: `🏆 Elite coaching available until ${req.subscription.endDate.toLocaleDateString()}`,
      coachData: {
        // Elite features here
      },
    });
  }
);

/**
 * Example 3: Access plan name in controller
 */
router.get(
  '/personalized-nutrition',
  auth,
  checkActiveSubscription,
  async (req, res) => {
    const daysRemaining = Math.ceil(
      (req.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    res.json({
      success: true,
      message: `Personalized plan active for ${daysRemaining} more days`,
      features: req.subscription.plan.features,
    });
  }
);

/**
 * Example 4: Chain with authorization
 * Only trainers with subscription can do this
 */
router.post(
  '/create-certification-training',
  auth,
  authorize('TRAINER'),            // Must be a trainer
  checkActiveSubscription,         // AND must have subscription
  async (req, res) => {
    res.json({
      success: true,
      message: 'Certification training created',
    });
  }
);

module.exports = router;

/**
 * HOW TO USE IN YOUR ROUTES:
 * 
 * 1. Add to workout.routes.js:
 *    router.get('/premium-workouts', 
 *      auth, 
 *      checkActiveSubscription,
 *      workoutController.getPremiumWorkouts
 *    );
 * 
 * 2. Add to chat.routes.js:
 *    router.post('/ai-coaching',
 *      auth,
 *      checkSubscriptionPlan('Pro'),
 *      chatController.getAICoaching
 *    );
 * 
 * 3. Add to nutrition.routes.js:
 *    router.get('/personalized-plans',
 *      auth,
 *      checkActiveSubscription,
 *      nutritionController.getPersonalizedPlans
 *    );
 */
