const { Router } = require('express');
const { auth, validate } = require('../../../middleware');
const notificationController = require('../controller/notification.controller');
const {
  registerDeviceTokenSchema,
  deleteDeviceTokenSchema,
} = require('../validators/notification.schemas');

const router = Router();

router.post('/tokens', auth, validate(registerDeviceTokenSchema), notificationController.registerDeviceToken);
router.delete('/tokens', auth, validate(deleteDeviceTokenSchema), notificationController.deleteDeviceToken);

module.exports = router;
