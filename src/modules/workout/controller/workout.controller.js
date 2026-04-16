const { ApiResponse } = require('../../../utils');
const workoutService = require('../service/workout.service');

function normalizeVideoUrl(videoUrl) {
  if (videoUrl === undefined) return undefined;
  const v = videoUrl === '' ? null : videoUrl;
  return v;
}

async function getWorkoutPlan(req, res, next) {
  try {
    const plan = await workoutService.getPublicPlan();
    return ApiResponse.success(res, {
      message: 'Workout plan',
      data: { plan },
    });
  } catch (err) {
    return next(err);
  }
}

async function createDay(req, res, next) {
  try {
    const day = await workoutService.createDay(req.body);
    return ApiResponse.created(res, {
      message: 'Day created',
      data: { day },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateDay(req, res, next) {
  try {
    const day = await workoutService.updateDay(req.params.dayId, req.body);
    return ApiResponse.success(res, {
      message: 'Day updated',
      data: { day },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteDay(req, res, next) {
  try {
    await workoutService.deleteDay(req.params.dayId);
    return ApiResponse.success(res, {
      message: 'Day deleted',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function createExercise(req, res, next) {
  try {
    const body = { ...req.body, videoUrl: normalizeVideoUrl(req.body.videoUrl) };
    const exercise = await workoutService.createExercise(req.params.dayId, body);
    return ApiResponse.created(res, {
      message: 'Exercise created',
      data: { exercise },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateExercise(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.videoUrl !== undefined) {
      payload.videoUrl = normalizeVideoUrl(payload.videoUrl);
    }
    const exercise = await workoutService.updateExercise(req.params.exerciseId, payload);
    return ApiResponse.success(res, {
      message: 'Exercise updated',
      data: { exercise },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteExercise(req, res, next) {
  try {
    await workoutService.deleteExercise(req.params.exerciseId);
    return ApiResponse.success(res, {
      message: 'Exercise deleted',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getWorkoutPlan,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  updateExercise,
  deleteExercise,
};
