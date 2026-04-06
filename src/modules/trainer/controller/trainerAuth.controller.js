const { ApiResponse } = require('../../../utils');
const trainerAuthService = require('../service/trainerAuth.service');

function computeAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const b = new Date(birthDate);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1;
  return age;
}

function sanitizeTrainer(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    gender: user.gender,
    birthDate: user.birthDate,
    age: computeAge(user.birthDate),
    trainerProfile: user.trainerProfile
      ? {
        id: user.trainerProfile.id,
        description: user.trainerProfile.description,
        certificates: user.trainerProfile.certificates?.map((c) => ({
          id: c.id,
          fileName: c.fileName,
          mimeType: c.mimeType,
          path: c.path,
          createdAt: c.createdAt,
        })) || [],
        createdAt: user.trainerProfile.createdAt,
        updatedAt: user.trainerProfile.updatedAt,
      }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await trainerAuthService.registerTrainer({
      ...req.body,
      certificates: req.files || [],
    });

    return ApiResponse.created(res, {
      message: 'Trainer registered successfully',
      data: {
        trainer: sanitizeTrainer(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register };

