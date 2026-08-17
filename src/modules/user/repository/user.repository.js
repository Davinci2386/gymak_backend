const { prisma } = require('../../../config');

function isMissingUserProfileImageTableError(error) {
  const message = String(error?.message || '');
  return message.includes('UserProfileImage') && message.includes('does not exist');
}

async function findByEmail(email) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        profileImages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  } catch (error) {
    if (!isMissingUserProfileImageTableError(error)) {
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...user, profileImages: [] };
  }
}

async function findById(id) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profileImages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  } catch (error) {
    if (!isMissingUserProfileImageTableError(error)) {
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { ...user, profileImages: [] };
  }
}

function createUser(data) {
  return prisma.user.create({ data });
}

function updateUserById(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

function listProfileImagesByUserId(userId) {
  return prisma.userProfileImage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  }).catch((error) => {
    if (isMissingUserProfileImageTableError(error)) return [];
    throw error;
  });
}

function createProfileImages(images) {
  return prisma.userProfileImage.createMany({
    data: images,
  }).catch((error) => {
    if (isMissingUserProfileImageTableError(error)) {
      return { count: 0 };
    }
    throw error;
  });
}

function deleteProfileImagesByIds(ids) {
  return prisma.userProfileImage.deleteMany({
    where: {
      id: { in: ids },
    },
  }).catch((error) => {
    if (isMissingUserProfileImageTableError(error)) {
      return { count: 0 };
    }
    throw error;
  });
}

async function deleteAccountDataKeepFinancial(userId) {
  return deleteAccountDataKeepFinancialWithOptions(userId, {});
}

async function deleteAccountDataKeepFinancialWithOptions(userId, options = {}) {
  const {
    deletedByAdminId = null,
    deletionReason = 'Account deleted',
  } = options;
  const now = Date.now();
  const anonymizedEmail = `deleted_${userId}_${now}@deleted.local`;
  const deletedAt = new Date();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.accountStatus === 'DELETED') return user;

    await tx.userSession.deleteMany({ where: { userId } });
    await tx.userNotification.deleteMany({ where: { userId } });
    await tx.trainerRequest.deleteMany({
      where: {
        OR: [{ playerId: userId }, { trainerId: userId }],
      },
    });
    await tx.trainerAssignment.deleteMany({
      where: {
        OR: [{ playerId: userId }, { trainerId: userId }],
      },
    });
    await tx.trainerProfile.deleteMany({ where: { userId } });
    await tx.workoutPlan.deleteMany({
      where: {
        OR: [{ playerId: userId }, { trainerId: userId }],
      },
    });
    await tx.nutritionMeal.deleteMany({
      where: {
        OR: [{ playerId: userId }, { trainerId: userId }],
      },
    });
    await tx.userProfileImage.deleteMany({ where: { userId } }).catch((error) => {
      if (isMissingUserProfileImageTableError(error)) {
        return { count: 0 };
      }
      throw error;
    });
    await tx.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: deletedAt,
      },
    });

    // Keep financial records by preserving the user row but removing identity/profile data.
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        firstName: 'Deleted',
        lastName: 'User',
        email: anonymizedEmail,
        passwordHash: `deleted_${now}`,
        gender: null,
        birthDate: null,
        goals: [],
        hasRoutine: false,
        trainTime: null,
        heightCm: 0,
        weightKg: 0,
        medicalCondition: null,
        injuries: null,
        medications: null,
        accountStatus: 'DELETED',
        deletedAt,
        deletedByAdminId,
        deletionReason,
      },
    });

    return updatedUser;
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUserById,
  listProfileImagesByUserId,
  createProfileImages,
  deleteProfileImagesByIds,
  deleteAccountDataKeepFinancial,
  deleteAccountDataKeepFinancialWithOptions,
};

