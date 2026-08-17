const { prisma } = require('../../../config');

function listTrainers() {
  return prisma.user.findMany({
    where: {
      role: 'TRAINER',
      accountStatus: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gender: true,
      birthDate: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

function findTrainerById(trainerId) {
  return prisma.user.findFirst({
    where: {
      id: trainerId,
      role: 'TRAINER',
      accountStatus: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gender: true,
      birthDate: true,
      role: true,

      profileImages: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          url: true,
          createdAt: true,
        },
      },

      trainerProfile: {
        select: {
          id: true,
          description: true,
          certificates: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      createdAt: true,
      updatedAt: true,
    },
  });
}

module.exports = {
  listTrainers,
  findTrainerById,
};