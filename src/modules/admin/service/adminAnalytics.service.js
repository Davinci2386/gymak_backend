const { PrismaClient } = require('../../../generated/prisma');

const prisma = new PrismaClient();

async function getSubscriptionKpis() {
  const now = new Date();

  const [
    activeSubscriptions,
    newSubscriptions,
    cancelledSubscriptions,
    expiredSubscriptions,
    newUsers,
    convertedUsers,
  ] = await Promise.all([
    prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endDate: { gt: now },
      },
    }),
    prisma.subscription.count({
      where: {},
    }),
    prisma.subscription.count({
      where: {
        status: 'CANCELLED',
      },
    }),
    prisma.subscription.count({
      where: {
        status: 'EXPIRED',
      },
    }),
    prisma.user.count({
      where: {
        role: 'USER',
      },
    }),
    prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    }),
  ]);

  const totalSubscriptionEvents = Math.max(newSubscriptions + cancelledSubscriptions + expiredSubscriptions, 1);
  const churnRatePercent = Number((((cancelledSubscriptions + expiredSubscriptions) / totalSubscriptionEvents) * 100).toFixed(2));
  const conversionRatePercent = newUsers === 0
    ? 0
    : Number(((convertedUsers.length / newUsers) * 100).toFixed(2));

  return {
    scope: 'all_time',
    activeSubscriptions,
    newSubscriptions,
    cancelledSubscriptions,
    expiredSubscriptions,
    churnRatePercent,
    conversionRatePercent,
  };
}

module.exports = {
  getSubscriptionKpis,
};
