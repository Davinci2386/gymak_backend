const { prisma } = require('../../../config');

const transactionSelect = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  stripePaymentIntentId: true,
  stripeChargeId: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      accountStatus: true,
    },
  },
  plan: {
    select: {
      id: true,
      name: true,
      price: true,
      durationDays: true,
    },
  },
  subscription: {
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      cancelledAt: true,
    },
  },
};

function buildTransactionFilter({ status, userId, planId, search, dateFrom, dateTo }) {
  return {
    ...(status ? { status } : {}),
    ...(userId ? { userId } : {}),
    ...(planId ? { planId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
            { stripePaymentIntentId: { contains: search, mode: 'insensitive' } },
            { stripeChargeId: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function listTransactions({ filters, skip, take, sortOrder }) {
  return prisma.payment.findMany({
    where: buildTransactionFilter(filters),
    select: transactionSelect,
    orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
    skip,
    take,
  });
}

function countTransactions(filters) {
  return prisma.payment.count({
    where: buildTransactionFilter(filters),
  });
}

module.exports = {
  listTransactions,
  countTransactions,
};
