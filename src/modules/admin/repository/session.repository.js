const { PrismaClient } = require('../../../generated/prisma');

const prisma = new PrismaClient();

class AdminSessionRepository {
  /**
   * Create session for admin
   */
  async createSession({ userId, refreshTokenHash, expiresAt }) {
    return prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Find active session by refresh token hash
   */
  async findActiveSessionByHash(refreshTokenHash) {
    return prisma.userSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Revoke session by refresh token hash
   */
  async revokeSessionByHash(refreshTokenHash) {
    return prisma.userSession.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

module.exports = new AdminSessionRepository();
