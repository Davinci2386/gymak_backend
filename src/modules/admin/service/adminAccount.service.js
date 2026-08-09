const { AppError } = require('../../../shared/errors');
const userRepo = require('../../user/repository/user.repository');
const adminAccountRepo = require('../repository/adminAccount.repository');

function roleLabel(role) {
  return role === 'TRAINER' ? 'Trainer' : 'User';
}

async function listAccounts({ role, includeDeleted = false }) {
  return adminAccountRepo.listAccountsByRole(role, { includeDeleted });
}

async function getUserDetails(userId) {
  const user = await adminAccountRepo.findUserDetailsById(userId);

  if (!user || user.role !== 'USER') {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function getTrainerDetails(trainerId) {
  const trainer = await adminAccountRepo.findTrainerDetailsById(trainerId);

  if (!trainer || trainer.role !== 'TRAINER') {
    throw new AppError('Trainer not found', 404);
  }

  return trainer;
}

async function deleteAccount({ accountId, expectedRole, adminId }) {
  const account = await adminAccountRepo.findAccountById(accountId);

  if (!account || account.role !== expectedRole) {
    throw new AppError(`${roleLabel(expectedRole)} not found`, 404);
  }

  const deletedAccount = await userRepo.deleteAccountDataKeepFinancialWithOptions(accountId, {
    deletedByAdminId: adminId,
    deletionReason: 'Deleted by admin',
  });

  return deletedAccount ?? account;
}

async function deleteUserAccount(accountId, adminId) {
  const account = await adminAccountRepo.findAccountById(accountId);

  if (!account || account.role !== 'USER') {
    throw new AppError('User not found', 404);
  }

  const deletedAccount = await userRepo.deleteAccountDataKeepFinancialWithOptions(accountId, {
    deletedByAdminId: adminId,
    deletionReason: 'Deleted by admin',
  });

  return deletedAccount ?? account;
}

module.exports = {
  listAccounts,
  getUserDetails,
  getTrainerDetails,
  deleteAccount,
  deleteUserAccount,
};
