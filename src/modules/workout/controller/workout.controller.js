const { ApiResponse } = require('../../../utils');
const workoutService = require('../service/workout.service');

function normalizeVideoUrl(videoUrl) {
  if (videoUrl === undefined) return undefined;
  const v = videoUrl === '' ? null : videoUrl;
  return v;
}

async function getWorkoutPlan(req, res, next) {
  try {
    const plan = await workoutService.getAssignedPlan({
      playerId: req.user.id,
      trainerId: req.assignment.trainerId,
    });
    return ApiResponse.success(res, {
      message: 'Workout plan',
      data: { plan },
    });
  } catch (err) {
    return next(err);
  }
}

async function getTrainerPlayerPlan(req, res, next) {
  try {
    const plan = await workoutService.getTrainerPlayerPlan({
      trainerId: req.user.id,
      playerId: req.params.playerId,
    });
    return ApiResponse.success(res, {
      message: 'Workout plan',
      data: { plan },
    });
  } catch (err) {
    return next(err);
  }
}

async function listCatalogExercises(req, res, next) {
  try {
    const exercises = await workoutService.listCatalogExercises({
      muscleGroup: req.query.muscleGroup,
    });
    return ApiResponse.success(res, {
      message: 'Workout catalog exercises',
      data: { exercises },
    });
  } catch (err) {
    return next(err);
  }
}

async function createDay(req, res, next) {
  try {
    const day = await workoutService.createDay({
      trainerId: req.user.id,
      playerId: req.params.playerId,
      ...req.body,
    });
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
    const day = await workoutService.updateDay({
      trainerId: req.user.id,
      dayId: req.params.dayId,
      ...req.body,
    });
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
    await workoutService.deleteDay({
      trainerId: req.user.id,
      dayId: req.params.dayId,
    });
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
    const exercise = await workoutService.createExercise({
      trainerId: req.user.id,
      dayId: req.params.dayId,
      ...body,
    });
    return ApiResponse.created(res, {
      message: 'Exercise created',
      data: { exercise },
    });
  } catch (err) {
    return next(err);
  }
}

async function createExerciseFromCatalog(req, res, next) {
  try {
    const exercise = await workoutService.createExerciseFromCatalog({
      trainerId: req.user.id,
      dayId: req.params.dayId,
      ...req.body,
    });
    return ApiResponse.created(res, {
      message: 'Exercise added from catalog',
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
    const exercise = await workoutService.updateExercise({
      trainerId: req.user.id,
      exerciseId: req.params.exerciseId,
      payload,
    });
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
    await workoutService.deleteExercise({
      trainerId: req.user.id,
      exerciseId: req.params.exerciseId,
    });
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
  getTrainerPlayerPlan,
  listCatalogExercises,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  createExerciseFromCatalog,
  updateExercise,
  deleteExercise,
};
