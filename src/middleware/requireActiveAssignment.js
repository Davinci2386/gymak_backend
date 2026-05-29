const { prisma } = require('../config');
const { AppError } = require('../shared/errors');

async function requireActiveAssignment(req, _res, next) {
  try {
    const playerId = req.user?.id;
    if (!playerId) {
      throw new AppError('Not authenticated', 401);
    }

    const assignment = await prisma.trainerAssignment.findFirst({
      where: { playerId, status: 'ACTIVE' },
      select: { id: true, playerId: true, trainerId: true },
    });

    if (!assignment) {
      const latestRequest = await prisma.trainerRequest.findFirst({
        where: { playerId },
        orderBy: { updatedAt: 'desc' },
        select: { status: true },
      });

      if (latestRequest?.status === 'PENDING') {
        throw new AppError('Your trainer request is waiting for coach approval. You cannot access this plan yet.', 403);
      }

      if (latestRequest?.status === 'REJECTED') {
        throw new AppError('Your trainer request was rejected. You can send a request to a coach again.', 403);
      }

      throw new AppError('You are not assigned to a trainer yet. Send a request to a coach to access this plan.', 403);
    }

    req.assignment = assignment;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = requireActiveAssignment;
