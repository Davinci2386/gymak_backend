const { prisma } = require('../../../config');

function endActiveAssignmentForPlayer(playerId) {
  return prisma.trainerAssignment.updateMany({
    where: { playerId, status: 'ACTIVE' },
    data: { status: 'ENDED', endedAt: new Date() },
  });
}

function createAssignment({ playerId, trainerId }) {
  return prisma.trainerAssignment.create({
    data: { playerId, trainerId },
  });
}

function findActiveAssignmentForPlayer(playerId) {
  return prisma.trainerAssignment.findFirst({
    where: { playerId, status: 'ACTIVE' },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });
}

function findActiveAssignmentBetween({ playerId, trainerId }) {
  return prisma.trainerAssignment.findFirst({
    where: { playerId, trainerId, status: 'ACTIVE' },
  });
}

module.exports = {
  endActiveAssignmentForPlayer,
  createAssignment,
  findActiveAssignmentForPlayer,
  findActiveAssignmentBetween,
};

