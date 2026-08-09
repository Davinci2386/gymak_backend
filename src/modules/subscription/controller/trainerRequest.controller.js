const { ApiResponse } = require('../../../utils');
const trainerRequestService = require('../service/trainerRequest.service');

async function create(req, res, next) {
  try {
    const playerId = req.user.id;
    const request = await trainerRequestService.requestTrainer({ playerId, trainerId: req.body.trainerId });
    return ApiResponse.created(res, {
      message: 'Trainer request created',
      data: { request },
    });
  } catch (err) {
    return next(err);
  }
}

async function myRequests(req, res, next) {
  try {
    const requests = await trainerRequestService.listMyRequests(req.user.id);
    return ApiResponse.success(res, { data: { requests } });
  } catch (err) {
    return next(err);
  }
}

async function inbox(req, res, next) {
  try {
    const requests = await trainerRequestService.listInbox(req.user.id);
    return ApiResponse.success(res, { data: { requests } });
  } catch (err) {
    return next(err);
  }
}

async function approve(req, res, next) {
  try {
    const assignment = await trainerRequestService.approveRequest({
      trainerId: req.user.id,
      requestId: req.params.requestId,
    });
    return ApiResponse.success(res, {
      message: 'Request approved',
      data: { assignment },
    });
  } catch (err) {
    return next(err);
  }
}

async function reject(req, res, next) {
  try {
    const request = await trainerRequestService.rejectRequest({
      trainerId: req.user.id,
      requestId: req.params.requestId,
    });
    return ApiResponse.success(res, {
      message: 'Request rejected',
      data: { request },
    });
  } catch (err) {
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const request = await trainerRequestService.cancelRequest({
      playerId: req.user.id,
      requestId: req.params.requestId,
    });
    return ApiResponse.success(res, {
      message: 'Request cancelled',
      data: { request },
    });
  } catch (err) {
    return next(err);
  }
}

async function myAssignment(req, res, next) {
  try {
    const assignment = await trainerRequestService.myAssignment(req.user.id);
    return ApiResponse.success(res, { data: { assignment } });
  } catch (err) {
    return next(err);
  }
}

async function myTrainerStatus(req, res, next) {
  try {
    const trainerStatus = await trainerRequestService.getMyTrainerStatus(req.user.id);
    return ApiResponse.success(res, {
      message: 'Trainer status fetched successfully',
      data: { trainerStatus },
    });
  } catch (err) {
    return next(err);
  }
}

async function trainerPlayers(req, res, next) {
  try {
    const players = await trainerRequestService.listTrainerPlayers(req.user.id);
    return ApiResponse.success(res, {
      message: 'Trainer players fetched successfully',
      data: { players },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  myRequests,
  inbox,
  approve,
  reject,
  cancel,
  myAssignment,
  myTrainerStatus,
  trainerPlayers,
};
