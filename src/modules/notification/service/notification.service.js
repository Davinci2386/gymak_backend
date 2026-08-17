const { AppError } = require('../../../shared/errors');
const { paginate, buildPaginationMeta } = require('../../../utils');
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

function mapUserNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    data: notification.data ?? {},
    isRead: notification.readAt !== null,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

function parseUnreadOnly(value) {
  return value === true || value === 'true' || value === '1';
}

async function listMyNotifications({ userId, page, limit, unreadOnly }) {
  const paginationInput = paginate({ page, limit });
  const onlyUnread = parseUnreadOnly(unreadOnly);

  const [notifications, totalItems, unreadCount] = await Promise.all([
    notificationRepo.listUserNotifications({
      userId,
      unreadOnly: onlyUnread,
      skip: paginationInput.skip,
      take: paginationInput.perPage,
    }),
    notificationRepo.countUserNotifications({ userId, unreadOnly: onlyUnread }),
    notificationRepo.countUnreadUserNotifications(userId),
  ]);

  return {
    notifications: notifications.map(mapUserNotification),
    unreadCount,
    pagination: buildPaginationMeta({
      currentPage: paginationInput.currentPage,
      perPage: paginationInput.perPage,
      totalItems,
    }),
  };
}

async function getUnreadCount(userId) {
  return notificationRepo.countUnreadUserNotifications(userId);
}

async function markNotificationAsRead({ userId, notificationId }) {
  const readAt = new Date();
  const result = await notificationRepo.markUserNotificationAsRead({
    userId,
    notificationId,
    readAt,
  });

  if (result.count === 0) {
    throw new AppError('Notification not found', 404);
  }

  const notification = await notificationRepo.findUserNotificationById({
    userId,
    notificationId,
  });
  return mapUserNotification(notification);
}

async function markAllNotificationsAsRead(userId) {
  const result = await notificationRepo.markAllUserNotificationsAsRead({
    userId,
    readAt: new Date(),
  });
  return result.count;
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

  const inboxNotification = await notificationRepo.createUserNotification({
    userId: targetUserId,
    title,
    body,
    data,
  });

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
    inboxNotificationId: inboxNotification.id,
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

async function sendChatNotification({
  recipientId,
  recipientRole,
  title,
  body,
  data,
}) {
  if (!['USER', 'TRAINER'].includes(recipientRole)) {
    throw new AppError('Invalid chat notification recipient role', 500);
  }

  return sendDirectNotification({
    adminId: null,
    targetUserId: recipientId,
    expectedRole: recipientRole,
    targetType: recipientRole,
    title,
    body,
    data,
  });
}

async function sendBroadcastNotification({ adminId, audienceRole, title, body, data }) {
  const [recipients, deviceTokens] = await Promise.all([
    notificationRepo.listActiveRecipientsByAudience(audienceRole),
    notificationRepo.listDeviceTokensByAudience(audienceRole),
  ]);

  const storedNotifications = await notificationRepo.createUserNotifications({
    userIds: recipients.map((recipient) => recipient.id),
    title,
    body,
    data,
  });

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
    storedNotifications: storedNotifications.count,
    targetedDevices: deviceTokens.length,
  };
}

module.exports = {
  registerDeviceToken,
  deleteDeviceToken,
  listMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendUserNotification,
  sendTrainerNotification,
  sendChatNotification,
  sendBroadcastNotification,
};
