const { ApiResponse } = require('../../../utils');
const adminAccountService = require('../service/adminAccount.service');

function parseIncludeDeleted(value) {
  return value === 'true';
}

function computeAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const b = new Date(birthDate);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1;
  return age;
}

function computeYearsOnPlatform(createdAt) {
  if (!createdAt) return 0;
  const today = new Date();
  const joined = new Date(createdAt);
  let years = today.getFullYear() - joined.getFullYear();
  const m = today.getMonth() - joined.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < joined.getDate())) years -= 1;
  return Math.max(0, years);
}

function formatAccount(account) {
  const activeSubscription = account.subscriptions?.[0];

  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role: account.role,
    accountStatus: account.accountStatus,
    ...(account.role === 'USER'
      ? {
          hasActiveSubscription: !!activeSubscription,
          ...(activeSubscription
            ? {
                subscription: {
                  id: activeSubscription.id,
                  status: activeSubscription.status,
                  startDate: activeSubscription.startDate,
                  endDate: activeSubscription.endDate,
                  plan: activeSubscription.plan,
                },
              }
            : {}),
        }
      : {}),
    deletedAt: account.deletedAt,
    deletionReason: account.deletionReason ?? null,
    trainerProfile: account.trainerProfile ?? null,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function formatUserDetails(user) {
  const currentAssignment = user.playerAssignments?.[0] ?? null;
  const currentSubscription = user.subscriptions?.[0] ?? null;

  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    age: computeAge(user.birthDate),
    birthDate: user.birthDate,
    accountStatus: user.accountStatus,
    joinedAt: user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    currentTrainer: currentAssignment
      ? {
          id: currentAssignment.trainer.id,
          firstName: currentAssignment.trainer.firstName,
          lastName: currentAssignment.trainer.lastName,
          fullName: `${currentAssignment.trainer.firstName} ${currentAssignment.trainer.lastName}`.trim(),
          email: currentAssignment.trainer.email,
          role: currentAssignment.trainer.role,
          assignment: {
            id: currentAssignment.id,
            status: currentAssignment.status,
            startedAt: currentAssignment.startedAt,
            endedAt: currentAssignment.endedAt,
            createdAt: currentAssignment.createdAt,
            updatedAt: currentAssignment.updatedAt,
          },
        }
      : null,
    subscription: currentSubscription
      ? {
          id: currentSubscription.id,
          status: currentSubscription.status,
          startDate: currentSubscription.startDate,
          endDate: currentSubscription.endDate,
          cancelledAt: currentSubscription.cancelledAt,
          createdAt: currentSubscription.createdAt,
          updatedAt: currentSubscription.updatedAt,
          plan: currentSubscription.plan,
        }
      : null,
  };
}

function formatTrainerDetails(trainer) {
  const activePlayers = (trainer.trainerAssignments || []).map((assignment) => ({
    id: assignment.player.id,
    firstName: assignment.player.firstName,
    lastName: assignment.player.lastName,
    fullName: `${assignment.player.firstName} ${assignment.player.lastName}`.trim(),
    email: assignment.player.email,
    role: assignment.player.role,
    assignment: {
      id: assignment.id,
      status: assignment.status,
      startedAt: assignment.startedAt,
      endedAt: assignment.endedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    },
  }));

  return {
    id: trainer.id,
    fullName: `${trainer.firstName} ${trainer.lastName}`.trim(),
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
    age: computeAge(trainer.birthDate),
    birthDate: trainer.birthDate,
    accountStatus: trainer.accountStatus,
    joinedAt: trainer.createdAt,
    yearsOnPlatform: computeYearsOnPlatform(trainer.createdAt),
    createdAt: trainer.createdAt,
    updatedAt: trainer.updatedAt,
    activePlayersCount: activePlayers.length,
    activePlayers,
  };
}

async function listUsers(req, res, next) {
  try {
    const users = await adminAccountService.listAccounts({
      role: 'USER',
      includeDeleted: parseIncludeDeleted(req.query.includeDeleted),
    });

    return ApiResponse.success(res, {
      message: 'Users retrieved successfully',
      data: {
        users: users.map(formatAccount),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listTrainers(req, res, next) {
  try {
    const trainers = await adminAccountService.listAccounts({
      role: 'TRAINER',
      includeDeleted: parseIncludeDeleted(req.query.includeDeleted),
    });

    return ApiResponse.success(res, {
      message: 'Trainers retrieved successfully',
      data: {
        trainers: trainers.map(formatAccount),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getUserDetails(req, res, next) {
  try {
    const user = await adminAccountService.getUserDetails(req.params.userId);

    return ApiResponse.success(res, {
      message: 'User details retrieved successfully',
      data: {
        user: formatUserDetails(user),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getTrainerDetails(req, res, next) {
  try {
    const trainer = await adminAccountService.getTrainerDetails(req.params.trainerId);

    return ApiResponse.success(res, {
      message: 'Trainer details retrieved successfully',
      data: {
        trainer: formatTrainerDetails(trainer),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await adminAccountService.deleteUserAccount(req.params.userId, req.user.id);

    return ApiResponse.success(res, {
      message: 'User deleted successfully.',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteTrainer(req, res, next) {
  try {
    const account = await adminAccountService.deleteAccount({
      accountId: req.params.trainerId,
      expectedRole: 'TRAINER',
      adminId: req.user.id,
    });

    return ApiResponse.success(res, {
      message: 'Trainer deleted successfully. Financial records were preserved.',
      data: {
        trainer: formatAccount(account),
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  getUserDetails,
  listTrainers,
  getTrainerDetails,
  deleteUser,
  deleteTrainer,
};
