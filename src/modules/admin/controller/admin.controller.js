const { ApiResponse } = require('../../../utils');
const adminService = require('../service/admin.service');

/**
 * Sanitize admin object for response
 */
function sanitizeAdmin(admin) {
  return {
    id: admin.id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

/**
 * Admin login
 * POST /api/admin/auth/login
 */
async function login(req, res, next) {
  try {
    const { admin, accessToken, refreshToken } = await adminService.login(req.body);
    return ApiResponse.success(res, {
      message: 'Admin logged in successfully',
      data: { admin: sanitizeAdmin(admin), accessToken, refreshToken },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Register new admin (admin only)
 * POST /api/admin/register
 */
async function register(req, res, next) {
  try {
    const admin = await adminService.register(req.body);
    return ApiResponse.created(res, {
      message: 'Admin registered successfully',
      data: { admin: sanitizeAdmin(admin) },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Refresh admin token
 * POST /api/admin/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const { admin, accessToken, refreshToken } = await adminService.refresh(req.body);
    return ApiResponse.success(res, {
      message: 'Token refreshed successfully',
      data: { admin: sanitizeAdmin(admin), accessToken, refreshToken },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Logout admin
 * POST /api/admin/auth/logout
 */
async function logout(req, res, next) {
  try {
    await adminService.logout(req.body);
    return ApiResponse.success(res, {
      message: 'Admin logged out successfully',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Change admin password
 * POST /api/admin/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { id: adminId } = req.user;
    const { currentPassword, newPassword } = req.body;

    const admin = await adminService.changePassword({
      adminId,
      currentPassword,
      newPassword,
    });

    return ApiResponse.success(res, {
      message: 'Password changed successfully',
      data: { admin: sanitizeAdmin(admin) },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get admin profile
 * GET /api/admin/me
 */
async function getProfile(req, res, next) {
  try {
    const { id: adminId } = req.user;
    const admin = await adminService.getProfile(adminId);

    return ApiResponse.success(res, {
      message: 'Admin profile retrieved',
      data: { admin: sanitizeAdmin(admin) },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Update admin profile (email, name)
 * PUT /api/admin/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { id: adminId } = req.user;
    const { firstName, lastName, email } = req.body;

    const admin = await adminService.updateProfile(adminId, {
      firstName,
      lastName,
      email,
    });

    return ApiResponse.success(res, {
      message: 'Admin profile updated successfully',
      data: { admin: sanitizeAdmin(admin) },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  login,
  register,
  refresh,
  logout,
  changePassword,
  getProfile,
  updateProfile,
};
