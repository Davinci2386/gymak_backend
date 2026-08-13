const { ApiResponse } = require('../../../utils');
const { AppError } = require('../../../shared/errors');
const userRepo = require('../repository/user.repository');
const { sanitizeUser } = require('./auth.controller');
const profileImageService = require('../service/profileImage.service');
const chatService = require('../../chat/service/chat.service');

async function me(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return ApiResponse.success(res, {
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const existingUser = await userRepo.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const data = {};
    if (req.body.firstName !== undefined) data.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) data.lastName = req.body.lastName;
    if (req.body.gender !== undefined) data.gender = req.body.gender;
    if (req.body.birthDate !== undefined) data.birthDate = new Date(req.body.birthDate);
    if (req.body.goals !== undefined) data.goals = req.body.goals;
    if (req.body.hasRoutine !== undefined) data.hasRoutine = req.body.hasRoutine;
    if (req.body.trainTime !== undefined) data.trainTime = req.body.trainTime;
    if (req.body.heightCm !== undefined) data.heightCm = req.body.heightCm;
    if (req.body.weightKg !== undefined) data.weightKg = req.body.weightKg;
    if (req.body.medical_condition !== undefined) data.medicalCondition = req.body.medical_condition;
    if (req.body.injuries !== undefined) data.injuries = req.body.injuries;
    if (req.body.medications !== undefined) data.medications = req.body.medications;

    if (req.body.email !== undefined) {
      const normalizedEmail = req.body.email.toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailOwner = await userRepo.findByEmail(normalizedEmail);
        if (emailOwner && emailOwner.id !== userId) {
          throw new AppError('Email already in use', 409);
        }
      }
      data.email = normalizedEmail;
    }

    const updatedUser = await userRepo.updateUserById(userId, data);

    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: { user: sanitizeUser(updatedUser) },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const role = req.user.role;

    const deletedAccount = await userRepo.deleteAccountDataKeepFinancialWithOptions(userId, {
      deletionReason: 'Deleted by account owner',
    });
    if (!deletedAccount) {
      throw new AppError('User not found', 404);
    }
    if (role === 'USER' || role === 'TRAINER') {
      await chatService.syncChatAccessForUser({ userId, role });
    }

    return ApiResponse.success(res, {
      message: 'Account deleted successfully. Financial records were preserved.',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

function parseDeleteUrls(rawValue) {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

async function updateProfileImages(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const files = req.files ?? [];
    const deleteUrls = parseDeleteUrls(req.body?.deleteUrls).filter((url) => typeof url === 'string' && url.trim() !== '');

    if (files.length === 0 && deleteUrls.length === 0) {
      throw new AppError('Provide at least one image to upload or one URL to delete', 400);
    }

    const existingUser = await userRepo.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const existingImages = existingUser.profileImages ?? [];
    const imagesToDelete = existingImages.filter((image) => deleteUrls.includes(image.url));
    const keptImagesCount = existingImages.length - imagesToDelete.length;
    const finalCount = keptImagesCount + files.length;

    if (finalCount < 1 || finalCount > 10) {
      throw new AppError('Profile images count must stay between 1 and 10', 400);
    }

    const uploadedImages = [];
    for (const file of files) {
      const uploaded = await profileImageService.uploadProfileImage({ userId, file });
      uploadedImages.push(uploaded);
    }

    if (imagesToDelete.length > 0) {
      await userRepo.deleteProfileImagesByIds(imagesToDelete.map((image) => image.id));
      await Promise.all(imagesToDelete.map((image) => profileImageService.deleteProfileImageByFileId(image.fileId)));
    }

    if (uploadedImages.length > 0) {
      await userRepo.createProfileImages(
        uploadedImages.map((image) => ({
          userId,
          url: image.url,
          fileId: image.fileId,
        })),
      );
    }

    const updatedUser = await userRepo.findById(userId);

    return ApiResponse.success(res, {
      message: 'Profile images updated successfully',
      data: { user: sanitizeUser(updatedUser) },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { me, updateMe, deleteMe, updateProfileImages };

