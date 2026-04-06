const { prisma } = require('../../../config');

function createRequest({ playerId, trainerId }) {
  return prisma.trainerRequest.create({
    data: { playerId, trainerId },
  });
}

function findPendingByPlayerAndTrainer({ playerId, trainerId }) {
  return prisma.trainerRequest.findFirst({
    where: { playerId, trainerId, status: 'PENDING' },
  });
}

function listPlayerRequests(playerId) {
  return prisma.trainerRequest.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });
}

function listTrainerInbox(trainerId) {
  return prisma.trainerRequest.findMany({
    where: { trainerId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      player: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });
}

function findById(id) {
  return prisma.trainerRequest.findUnique({ where: { id } });
}

function updateStatus(id, status) {
  return prisma.trainerRequest.update({
    where: { id },
    data: { status },
  });
}

module.exports = {
  createRequest,
  findPendingByPlayerAndTrainer,
  listPlayerRequests,
  listTrainerInbox,
  findById,
  updateStatus,
};

