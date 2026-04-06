require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',

  // TODO: Add Stripe keys
  // STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  // STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // TODO: Add Firebase config
  // FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
};

module.exports = env;
