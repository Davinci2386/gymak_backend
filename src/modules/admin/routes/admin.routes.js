const { Router } = require('express');
const { validate, auth, authorize } = require('../../../middleware');
const {
  adminLoginSchema,
  adminRegisterSchema,
  changePasswordSchema,
  updateAdminProfileSchema,
  refreshTokenSchema,
} = require('../validators/admin.schemas');
const adminController = require('../controller/admin.controller');
const adminAnalyticsController = require('../controller/adminAnalytics.controller');
const adminAccountController = require('../controller/adminAccount.controller');
const notificationController = require('../../notification/controller/notification.controller');
const postController = require('../../post/controller/post.controller');
const {
  sendNotificationSchema,
  sendBroadcastNotificationSchema,
} = require('../../notification/validators/notification.schemas');
const { rejectPostSchema } = require('../../post/validators/post.schemas');
const privacyPolicyController = require('../../privacyPolicy/controller/privacyPolicy.controller');
const { updatePrivacyPolicySchema } = require('../../privacyPolicy/validators/privacyPolicy.schemas');

const router = Router();

/**
 * Public routes (no auth required)
 */
router.post('/auth/login', validate(adminLoginSchema), adminController.login);

/**
 * Admin authorized routes
 */
router.post('/auth/refresh', auth, validate(refreshTokenSchema), adminController.refresh);
router.post('/auth/logout', auth, validate(refreshTokenSchema), adminController.logout);

/**
 * Admin management routes (admin only)
 */
router.post(
  '/register',
  auth,
  authorize('ADMIN'),
  validate(adminRegisterSchema),
  adminController.register
);

/**
 * Admin personal routes (authenticated admins)
 */
router.get('/me', auth, authorize('ADMIN'), adminController.getProfile);
router.put(
  '/profile',
  auth,
  authorize('ADMIN'),
  validate(updateAdminProfileSchema),
  adminController.updateProfile
);
router.post(
  '/change-password',
  auth,
  authorize('ADMIN'),
  validate(changePasswordSchema),
  adminController.changePassword
);

router.get(
  '/analytics/subscriptions/kpis',
  auth,
  authorize('ADMIN'),
  adminAnalyticsController.getSubscriptionKpis
);

router.get('/users', auth, authorize('ADMIN'), adminAccountController.listUsers);
router.get('/users/:userId', auth, authorize('ADMIN'), adminAccountController.getUserDetails);
router.get('/trainers', auth, authorize('ADMIN'), adminAccountController.listTrainers);
router.get('/trainers/:trainerId', auth, authorize('ADMIN'), adminAccountController.getTrainerDetails);
router.delete('/users/:userId', auth, authorize('ADMIN'), adminAccountController.deleteUser);
router.delete('/trainers/:trainerId', auth, authorize('ADMIN'), adminAccountController.deleteTrainer);
router.post(
  '/notifications/users/:userId',
  auth,
  authorize('ADMIN'),
  validate(sendNotificationSchema),
  notificationController.sendUserNotification
);
router.post(
  '/notifications/trainers/:trainerId',
  auth,
  authorize('ADMIN'),
  validate(sendNotificationSchema),
  notificationController.sendTrainerNotification
);
router.post(
  '/notifications/broadcast',
  auth,
  authorize('ADMIN'),
  validate(sendBroadcastNotificationSchema),
  notificationController.sendBroadcastNotification
);
router.get('/posts', auth, authorize('ADMIN'), postController.listAdminPosts);
router.get('/posts/:postId', auth, authorize('ADMIN'), postController.getAdminPost);
router.post('/posts/:postId/approve', auth, authorize('ADMIN'), postController.approvePost);
router.post(
  '/posts/:postId/reject',
  auth,
  authorize('ADMIN'),
  validate(rejectPostSchema),
  postController.rejectPost
);
router.put(
  '/privacy-policy',
  auth,
  authorize('ADMIN'),
  validate(updatePrivacyPolicySchema),
  privacyPolicyController.updatePrivacyPolicy
);

module.exports = router;
