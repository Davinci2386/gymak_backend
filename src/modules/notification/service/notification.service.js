const { AppError } = require('../../../shared/errors');
const firebaseAdminService = require('../../../shared/services/firebaseAdmin.service');
const notificationRepo = require('../repository/notification.repository');

function normalizeNotificationData(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)]),
  );
}

function buildLogStatus({ sentCount, failedCount }) {
  if (sentCount > 0 && failedCount > 0) return 'PARTIAL';
  if (sentCount > 0) return 'SENT';
  return 'FAILED';
}

async function registerDeviceToken({ userId, token, platform, deviceName }) {
  const deviceToken = await notificationRepo.upsertDeviceToken({
    userId,
    token,
    platform,
    deviceName: deviceName || null,
  });

  return {
    id: deviceToken.id,
    token: deviceToken.token,
    platform: deviceToken.platform,
    deviceName: deviceToken.deviceName,
    lastSeenAt: deviceToken.lastSeenAt,
  };
}

async function deleteDeviceToken({ userId, token }) {
  await notificationRepo.deleteDeviceToken({ userId, token });
}

async function dispatchAndLog({
  adminId,
  targetType,
  targetUserId = null,
  audienceRole = null,
  title,
  body,
  data = {},
  tokens,
}) {
  const normalizedData = normalizeNotificationData(data);

  if (tokens.length === 0) {
    const log = await notificationRepo.createNotificationLog({
      createdByAdminId: adminId,
      targetType,
      targetUserId,
      audienceRole,
      title,
      body,
      data,
      sentCount: 0,
      failedCount: 0,
      status: 'FAILED',
      failureReason: 'No device tokens found',
    });

    return {
      logId: log.id,
      status: log.status,
      sentCount: 0,
      failedCount: 0,
      invalidTokensRemoved: 0,
    };
  }

  try {
    const result = await firebaseAdminService.sendMulticastNotification({
      tokens,
      title,
      body,
      data: normalizedData,
    });

    if (result.invalidTokens.length > 0) {
      await notificationRepo.deleteDeviceTokensByTokens(result.invalidTokens);
    }

    const log = await notificationRepo.createNotificationLog({
      createdByAdminId: adminId,
      targetType,
      targetUserId,
      audienceRole,
      title,
      body,
      data,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      status: buildLogStatus(result),
      failureReason: result.sentCount === 0 && result.failedCount > 0
        ? 'Firebase rejected all targeted device tokens'
        : null,
    });

    return {
      logId: log.id,
      status: log.status,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      invalidTokensRemoved: result.invalidTokens.length,
    };
  } catch (error) {
    await notificationRepo.createNotificationLog({
      createdByAdminId: adminId,
      targetType,
      targetUserId,
      audienceRole,
      title,
      body,
      data,
      sentCount: 0,
      failedCount: tokens.length,
      status: 'FAILED',
      failureReason: error.message,
    });

    throw error;
  }
}

async function sendDirectNotification({
  adminId,
  targetUserId,
  expectedRole,
  targetType,
  title,
  body,
  data,
}) {
  const recipient = await notificationRepo.findActiveUserById(targetUserId);

  if (!recipient || recipient.role !== expectedRole) {
    const label = expectedRole === 'TRAINER' ? 'Trainer' : 'User';
    throw new AppError(`${label} not found`, 404);
  }

  const tokens = await notificationRepo.listDeviceTokensByUserId(targetUserId);

  const delivery = await dispatchAndLog({
    adminId,
    targetType,
    targetUserId,
    title,
    body,
    data,
    tokens: tokens.map((item) => item.token),
  });

  return {
    ...delivery,
    recipient,
  };
}

async function sendUserNotification({ adminId, userId, title, body, data }) {
  return sendDirectNotification({
    adminId,
    targetUserId: userId,
    expectedRole: 'USER',
    targetType: 'USER',
    title,
    body,
    data,
  });
}

async function sendTrainerNotification({ adminId, trainerId, title, body, data }) {
  return sendDirectNotification({
    adminId,
    targetUserId: trainerId,
    expectedRole: 'TRAINER',
    targetType: 'TRAINER',
    title,
    body,
    data,
  });
}

async function sendBroadcastNotification({ adminId, audienceRole, title, body, data }) {
  const deviceTokens = await notificationRepo.listDeviceTokensByAudience(audienceRole);

  const delivery = await dispatchAndLog({
    adminId,
    targetType: 'BROADCAST',
    audienceRole: audienceRole === 'ALL' ? null : audienceRole,
    title,
    body,
    data,
    tokens: deviceTokens.map((item) => item.token),
  });

  return {
    ...delivery,
    audienceRole,
    targetedDevices: deviceTokens.length,
  };
}

module.exports = {
  registerDeviceToken,
  deleteDeviceToken,
  sendUserNotification,
  sendTrainerNotification,
  sendBroadcastNotification,
};
