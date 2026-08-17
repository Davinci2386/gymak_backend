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

async function sendMessage(req, res, next) {
  try {
    const result = await chatService.sendTextMessage({
      senderId: req.user.id,
      senderRole: req.user.role,
      playerId: req.body.playerId,
      text: req.body.text,
      clientMessageId: req.body.clientMessageId,
    });

    return ApiResponse.success(res, {
      statusCode: result.created ? 201 : 200,
      message: result.created
        ? 'Message sent successfully'
        : 'Message already sent',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createFirebaseToken, sendMessage };
