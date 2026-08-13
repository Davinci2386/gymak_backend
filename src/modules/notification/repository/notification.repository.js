const { prisma } = require('../../../config');

function upsertDeviceToken({ userId, token, platform = 'UNKNOWN', deviceName = null }) {
  return prisma.deviceToken.upsert({
    where: { token },
    update: {
      userId,
      platform,
      deviceName,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      token,
      platform,
      deviceName,
    },
  });
}

function deleteDeviceToken({ userId, token }) {
  return prisma.deviceToken.deleteMany({
    where: {
      userId,
      token,
    },
  });
}

function deleteDeviceTokensByTokens(tokens) {
  if (!tokens?.length) {
    return Promise.resolve({ count: 0 });
  }

  return prisma.deviceToken.deleteMany({
    where: {
      token: { in: tokens },
    },
  });
}

function listDeviceTokensByUserId(userId) {
  return prisma.deviceToken.findMany({
    where: { userId },
    select: {
      token: true,
    },
  });
}

function listDeviceTokensByAudience(audienceRole) {
  return prisma.deviceToken.findMany({
    where: {
      user: {
        accountStatus: 'ACTIVE',
        ...(audienceRole === 'ALL'
          ? { role: { in: ['USER', 'TRAINER'] } }
          : { role: audienceRole }),
      },
    },
    select: {
      token: true,
      userId: true,
    },
  });
}

function findActiveUserById(userId) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      accountStatus: 'ACTIVE',
    },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}

function createNotificationLog(data) {
  return prisma.notificationLog.create({ data });
}

function createUserNotification({ userId, title, body, data }) {
  return prisma.userNotification.create({
    data: {
      userId,
      title,
      body,
      data: data ?? {},
    },
  });
}

function createUserNotifications({ userIds, title, body, data }) {
  if (!userIds.length) return Promise.resolve({ count: 0 });

  return prisma.userNotification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title,
      body,
      data: data ?? {},
    })),
  });
}

function listActiveRecipientsByAudience(audienceRole) {
  return prisma.user.findMany({
    where: {
      accountStatus: 'ACTIVE',
      ...(audienceRole === 'ALL'
        ? { role: { in: ['USER', 'TRAINER'] } }
        : { role: audienceRole }),
    },
    select: { id: true },
  });
}

function listUserNotifications({ userId, unreadOnly, skip, take }) {
  return prisma.userNotification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take,
  });
}

function countUserNotifications({ userId, unreadOnly }) {
  return prisma.userNotification.count({
    where: {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
  });
}

function countUnreadUserNotifications(userId) {
  return prisma.userNotification.count({
    where: { userId, readAt: null },
  });
}

function markUserNotificationAsRead({ userId, notificationId, readAt }) {
  return prisma.userNotification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt },
  });
}

function findUserNotificationById({ userId, notificationId }) {
  return prisma.userNotification.findFirst({
    where: { id: notificationId, userId },
  });
}

function markAllUserNotificationsAsRead({ userId, readAt }) {
  return prisma.userNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt },
  });
}

module.exports = {
  upsertDeviceToken,
  deleteDeviceToken,
  deleteDeviceTokensByTokens,
  listDeviceTokensByUserId,
  listDeviceTokensByAudience,
  findActiveUserById,
  createNotificationLog,
  createUserNotification,
  createUserNotifications,
  listActiveRecipientsByAudience,
  listUserNotifications,
  countUserNotifications,
  countUnreadUserNotifications,
  markUserNotificationAsRead,
  findUserNotificationById,
  markAllUserNotificationsAsRead,
};
