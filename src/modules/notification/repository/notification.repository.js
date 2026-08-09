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

module.exports = {
  upsertDeviceToken,
  deleteDeviceToken,
  deleteDeviceTokensByTokens,
  listDeviceTokensByUserId,
  listDeviceTokensByAudience,
  findActiveUserById,
  createNotificationLog,
};
