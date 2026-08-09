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

function listActiveAssignmentsForTrainer(trainerId) {
  return prisma.trainerAssignment.findMany({
    where: { trainerId, status: 'ACTIVE' },
    include: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          gender: true,
          birthDate: true,
          goals: true,
          hasRoutine: true,
          trainTime: true,
          heightCm: true,
          weightKg: true,
          medicalCondition: true,
          injuries: true,
          medications: true,
          createdAt: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
}

module.exports = {
  endActiveAssignmentForPlayer,
  createAssignment,
  findActiveAssignmentForPlayer,
  findActiveAssignmentBetween,
  listActiveAssignmentsForTrainer,
};
