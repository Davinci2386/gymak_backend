const admin = require('firebase-admin');

const { env } = require('../../config');
const { AppError } = require('../errors');

const MAX_TOKENS_PER_BATCH = 500;
const INVALID_TOKEN_ERROR_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function ensureFirebaseConfig() {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new AppError('Firebase Admin is not configured', 500);
  }
}

function getPrivateKey() {
  return env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
}

function getFirebaseApp() {
  ensureFirebaseConfig();

  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: getPrivateKey(),
    }),
  });
}

function chunkTokens(tokens) {
  const chunks = [];
  for (let index = 0; index < tokens.length; index += MAX_TOKENS_PER_BATCH) {
    chunks.push(tokens.slice(index, index + MAX_TOKENS_PER_BATCH));
  }
  return chunks;
}

async function sendMulticastNotification({ tokens, title, body, data = {} }) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return {
      sentCount: 0,
      failedCount: 0,
      invalidTokens: [],
    };
  }

  const messaging = getFirebaseApp().messaging();
  const invalidTokens = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const tokenBatch of chunkTokens(tokens)) {
    const response = await messaging.sendEachForMulticast({
      tokens: tokenBatch,
      notification: { title, body },
      data,
    });

    sentCount += response.successCount;
    failedCount += response.failureCount;

    response.responses.forEach((result, index) => {
      if (result.success) return;
      const errorCode = result.error?.code;
      if (INVALID_TOKEN_ERROR_CODES.has(errorCode)) {
        invalidTokens.push(tokenBatch[index]);
      }
    });
  }

  return {
    sentCount,
    failedCount,
    invalidTokens,
  };
}

module.exports = {
  sendMulticastNotification,
};
