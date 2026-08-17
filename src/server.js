const app = require('./app');
const { env } = require('./config');
const logger = require('./utils/logger');
const { startSubscriptionTasks } = require('./tasks/subscriptionTasks');

const { PORT, NODE_ENV } = env;

// Start background tasks
const subscriptionTask = startSubscriptionTasks();

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT} [${NODE_ENV}]`);
  logger.info('✅ Subscription maintenance tasks started');
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  clearInterval(subscriptionTask);
  logger.info('Subscription tasks stopped');
});