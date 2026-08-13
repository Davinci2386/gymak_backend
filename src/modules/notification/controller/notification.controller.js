const { ApiResponse } = require('../../../utils');
const notificationService = require('../service/notification.service');

async function registerDeviceToken(req, res, next) {
  try {
    const deviceToken = await notificationService.registerDeviceToken({
      userId: req.user.id,
      ...req.body,
    });

    return ApiResponse.success(res, {
      message: 'Device token registered successfully',
      data: { deviceToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteDeviceToken(req, res, next) {
  try {
    await notificationService.deleteDeviceToken({
      userId: req.user.id,
      token: req.body.token,
    });

    return ApiResponse.success(res, {
      message: 'Device token deleted successfully',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyNotifications(req, res, next) {
  try {
    const result = await notificationService.listMyNotifications({
      userId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
      unreadOnly: req.query.unreadOnly,
    });

    return ApiResponse.success(res, {
      message: 'Notifications retrieved successfully',
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      },
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, {
      message: 'Unread notifications count retrieved successfully',
      data: { unreadCount },
    });
  } catch (err) {
    return next(err);
  }
}

async function markNotificationAsRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationAsRead({
      userId: req.user.id,
      notificationId: req.params.notificationId,
    });
    return ApiResponse.success(res, {
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (err) {
    return next(err);
  }
}

async function markAllNotificationsAsRead(req, res, next) {
  try {
    const updatedCount = await notificationService.markAllNotificationsAsRead(req.user.id);
    return ApiResponse.success(res, {
      message: 'All notifications marked as read',
      data: { updatedCount },
    });
  } catch (err) {
    return next(err);
  }
}

async function sendUserNotification(req, res, next) {
  try {
    const result = await notificationService.sendUserNotification({
      adminId: req.user.id,
      userId: req.params.userId,
      ...req.body,
    });

    return ApiResponse.success(res, {
      message: 'User notification processed',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function sendTrainerNotification(req, res, next) {
  try {
    const result = await notificationService.sendTrainerNotification({
      adminId: req.user.id,
      trainerId: req.params.trainerId,
      ...req.body,
    });

    return ApiResponse.success(res, {
      message: 'Trainer notification processed',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function sendBroadcastNotification(req, res, next) {
  try {
    const result = await notificationService.sendBroadcastNotification({
      adminId: req.user.id,
      ...req.body,
    });

    return ApiResponse.success(res, {
      message: 'Broadcast notification processed',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  registerDeviceToken,
  deleteDeviceToken,
  listMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendUserNotification,
  sendTrainerNotification,
  sendBroadcastNotification,
};
