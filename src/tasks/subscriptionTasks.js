const subscriptionService = require('../modules/subscription/service/subscription.service');

/**
 * Start subscription maintenance tasks
 * Runs automatic checks and updates
 */
const startSubscriptionTasks = () => {
  // Update expired subscriptions every hour
  const expirationTask = setInterval(async () => {
    try {
      const result = await subscriptionService.expireSubscriptions();
      if (result.count > 0) {
        console.log(`✅ [Subscription Task] Expired ${result.count} subscriptions`);
      }
    } catch (error) {
      console.error('[Subscription Task Error]', error.message);
    }
  }, 60 * 60 * 1000); // Every hour

  // Also run on startup
  (async () => {
    try {
      const result = await subscriptionService.expireSubscriptions();
      if (result.count > 0) {
        console.log(`✅ [Startup] Expired ${result.count} subscriptions`);
      }
    } catch (error) {
      console.error('[Startup Error]', error.message);
    }
  })();

  return expirationTask;
};

module.exports = {
  startSubscriptionTasks,
};
