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

module.exports = router;
