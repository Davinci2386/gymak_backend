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

module.exports = { listTrainers };
