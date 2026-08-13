const { Router } = require('express');
const { auth } = require('../../../middleware');
const chatController = require('../controller/chat.controller');

const router = Router();

router.get('/firebase-token', auth, chatController.createFirebaseToken);

module.exports = router;
