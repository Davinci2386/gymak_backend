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
      select: { id: true },
    });

    if (!assignment) {
      throw new AppError('You are not assigned to a trainer yet', 403);
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = requireActiveAssignment;

