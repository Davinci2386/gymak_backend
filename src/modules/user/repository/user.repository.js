const { prisma } = require('../../../config');

function isMissingUserProfileImageTableError(error) {
  const message = String(error?.message || '');
  return message.includes('UserProfileImage') && message.includes('does not exist');
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
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
  const now = Date.now();
  const anonymizedEmail = `deleted_${userId}_${now}@deleted.local`;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    await tx.userSession.deleteMany({ where: { userId } });
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
    await tx.subscription.deleteMany({ where: { userId } });

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
        medicalCondition: null,
        injuries: null,
        medications: null,
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
};

