const { AppError } = require('../../../shared/errors');
const trainerRequestRepo = require('../repository/trainerRequest.repository');
const assignmentRepo = require('../repository/assignment.repository');
const userRepo = require('../../user/repository/user.repository');

async function requestTrainer({ playerId, trainerId }) {
  if (playerId === trainerId) {
    throw new AppError('You cannot request yourself as a trainer', 400);
  }

  const trainer = await userRepo.findById(trainerId);
  if (!trainer || trainer.role !== 'TRAINER') {
    throw new AppError('Trainer not found', 404);
  }

  const existingPending = await trainerRequestRepo.findPendingByPlayerAndTrainer({ playerId, trainerId });
  if (existingPending) {
    throw new AppError('You already have a pending request for this trainer', 409);
  }

  const active = await assignmentRepo.findActiveAssignmentBetween({ playerId, trainerId });
  if (active) {
    throw new AppError('You are already assigned to this trainer', 409);
  }

  return trainerRequestRepo.createRequest({ playerId, trainerId });
}

async function listMyRequests(playerId) {
  return trainerRequestRepo.listPlayerRequests(playerId);
}

async function listInbox(trainerId) {
  return trainerRequestRepo.listTrainerInbox(trainerId);
}

async function approveRequest({ trainerId, requestId }) {
  const req = await trainerRequestRepo.findById(requestId);
  if (!req) throw new AppError('Request not found', 404);
  if (req.trainerId !== trainerId) throw new AppError('Forbidden', 403);
  if (req.status !== 'PENDING') throw new AppError('Request is not pending', 409);

  // End any active assignment for this player, then create a new one
  await assignmentRepo.endActiveAssignmentForPlayer(req.playerId);
  const assignment = await assignmentRepo.createAssignment({ playerId: req.playerId, trainerId: req.trainerId });
  await trainerRequestRepo.updateStatus(requestId, 'APPROVED');

  return assignment;
}

async function rejectRequest({ trainerId, requestId }) {
  const req = await trainerRequestRepo.findById(requestId);
  if (!req) throw new AppError('Request not found', 404);
  if (req.trainerId !== trainerId) throw new AppError('Forbidden', 403);
  if (req.status !== 'PENDING') throw new AppError('Request is not pending', 409);

  return trainerRequestRepo.updateStatus(requestId, 'REJECTED');
}

async function cancelRequest({ playerId, requestId }) {
  const req = await trainerRequestRepo.findById(requestId);
  if (!req) throw new AppError('Request not found', 404);
  if (req.playerId !== playerId) throw new AppError('Forbidden', 403);
  if (req.status !== 'PENDING') throw new AppError('Request is not pending', 409);

  return trainerRequestRepo.updateStatus(requestId, 'CANCELLED');
}

async function myAssignment(playerId) {
  return assignmentRepo.findActiveAssignmentForPlayer(playerId);
}

module.exports = {
  requestTrainer,
  listMyRequests,
  listInbox,
  approveRequest,
  rejectRequest,
  cancelRequest,
  myAssignment,
};

