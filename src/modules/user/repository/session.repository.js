const { prisma } = require('../../../config');

function createSession({ userId, refreshTokenHash, expiresAt }) {
  return prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
    },
  });
}

function findActiveSessionByHash(refreshTokenHash) {
  return prisma.userSession.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

function revokeSessionByHash(refreshTokenHash) {
  return prisma.userSession.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  createSession,
  findActiveSessionByHash,
  revokeSessionByHash,
};

