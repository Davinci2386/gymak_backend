const { ApiResponse } = require('../../../utils');
const chatService = require('../service/chat.service');

async function createFirebaseToken(req, res, next) {
  try {
    const tokenData = await chatService.createFirebaseToken({
      userId: req.user.id,
      role: req.user.role,
    });

    return ApiResponse.success(res, {
      message: 'Firebase chat token created successfully',
      data: tokenData,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createFirebaseToken };
