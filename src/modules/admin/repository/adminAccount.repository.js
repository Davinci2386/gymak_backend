const { prisma } = require('../../../config');

function buildRoleFilter(role, includeDeleted) {
  return {
    role,
    ...(includeDeleted ? {} : { accountStatus: 'ACTIVE' }),
  };
}

function listAccountsByRole(role, { includeDeleted = false } = {}) {
  return prisma.user.findMany({
    where: buildRoleFilter(role, includeDeleted),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      accountStatus: true,
      deletedAt: true,
      deletionReason: true,
      createdAt: true,
      updatedAt: true,
      trainerProfile: {
        select: {
          id: true,
          description: true,
        },
      },
      subscriptions: {
        where: {
          status: 'ACTIVE',
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              durationDays: true,
            },
          },
        },
      },
    },
  });
}

function findAccountById(accountId) {
  return prisma.user.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      accountStatus: true,
      deletedAt: true,
      deletionReason: true,
      createdAt: true,
      updatedAt: true,
      trainerProfile: {
        select: {
          id: true,
          description: true,
        },
      },
      subscriptions: {
        where: {
          status: 'ACTIVE',
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              durationDays: true,
            },
          },
        },
      },
    },
  });
}

function findUserDetailsById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      accountStatus: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
      playerAssignments: {
        where: { status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
          updatedAt: true,
          trainer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      subscriptions: {
        where: {
          status: 'ACTIVE',
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          cancelledAt: true,
          createdAt: true,
          updatedAt: true,
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              durationDays: true,
              features: true,
              isActive: true,
            },
          },
        },
      },
    },
  });
}

function findTrainerDetailsById(trainerId) {
  return prisma.user.findUnique({
    where: { id: trainerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      accountStatus: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
      trainerAssignments: {
        where: { status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
          updatedAt: true,
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

module.exports = {
  listAccountsByRole,
  findAccountById,
  findUserDetailsById,
  findTrainerDetailsById,
};
