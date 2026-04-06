const { ApiResponse } = require('../../../utils');
const { AppError } = require('../../../shared/errors');
const userRepo = require('../repository/user.repository');
const { sanitizeUser } = require('./auth.controller');

async function me(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return ApiResponse.success(res, {
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { me };

