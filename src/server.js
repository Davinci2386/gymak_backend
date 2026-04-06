const app = require('./app');
const { env } = require('./config');
const logger = require('./utils/logger');

const { PORT, NODE_ENV } = env;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} [${NODE_ENV}]`);
});
