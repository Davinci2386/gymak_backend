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
router.get('/', auth, notificationController.listMyNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllNotificationsAsRead);
router.patch('/:notificationId/read', auth, notificationController.markNotificationAsRead);

module.exports = router;
