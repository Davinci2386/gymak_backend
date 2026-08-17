const { Router } = require('express');
const { auth, validate } = require('../../../middleware');
const chatController = require('../controller/chat.controller');
const { sendChatMessageSchema } = require('../validators/chat.schemas');

const router = Router();

router.get('/firebase-token', auth, chatController.createFirebaseToken);
router.post(
  '/messages',
  auth,
  validate(sendChatMessageSchema),
  chatController.sendMessage,
);

module.exports = router;
