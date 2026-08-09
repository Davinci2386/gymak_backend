const { ApiResponse } = require('../../../utils');
const authService = require('../service/auth.service');

function sanitizeUser(user) {
  const profileImageUrls = Array.isArray(user.profileImages)
    ? user.profileImages.map((image) => image.url).filter(Boolean)
    : [];

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    gender: user.gender,
    birthDate: user.birthDate,
    goals: user.goals ?? [],
    hasRoutine: user.hasRoutine ?? false,
    trainTime: user.trainTime ?? null,
    heightCm: user.heightCm ?? 0,
    weightKg: user.weightKg ?? 0,
    medical_condition: user.medicalCondition ?? null,
    injuries: user.injuries ?? null,
    medications: user.medications ?? null,
    profileImageUrls,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    return ApiResponse.created(res, {
      message: 'Registered successfully',
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    return ApiResponse.success(res, {
      message: 'Logged in successfully',
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(req.body);
    return ApiResponse.success(res, {
      message: 'Token refreshed successfully',
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body);
    return ApiResponse.success(res, {
      message: 'Logged out successfully',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, logout, sanitizeUser };

