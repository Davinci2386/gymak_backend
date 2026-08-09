const { AppError } = require('../../../shared/errors');
const mediaUploadService = require('../../../shared/services/mediaUpload.service');
const assignmentRepo = require('../../subscription/repository/assignment.repository');
const workoutRepo = require('../repository/workout.repository');
const MUSCLE_GROUPS = new Set(['BICEPS', 'TRICEPS', 'CHEST', 'LEGS', 'BACK', 'SHOULDERS', 'CARDIO']);

function mapExercise(exercise) {
  return {
    id: exercise.id,
    dayId: exercise.dayId,
    name: exercise.name,
    description: exercise.description,
    imageUrls: exercise.imageUrls,
    videoUrl: exercise.videoUrl,
    muscleGroup: exercise.muscleGroup,
    sortOrder: exercise.sortOrder,
  };
}

function mapDay(day) {
  return {
    id: day.id,
    planId: day.planId,
    dayNumber: day.dayNumber,
    label: day.label,
    exercises: (day.exercises || []).map(mapExercise),
  };
}

function mapPlan(plan) {
  if (!plan) return null;
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    playerId: plan.playerId,
    trainerId: plan.trainerId,
    days: (plan.days || []).map(mapDay),
  };
}

async function ensureTrainerAssignedToPlayer({ trainerId, playerId }) {
  const assignment = await assignmentRepo.findActiveAssignmentBetween({ playerId, trainerId });
  if (!assignment) {
    throw new AppError('You can manage plans only for players assigned to you', 403);
  }
  return assignment;
}

async function ensurePlayerPlan({ playerId, trainerId }) {
  let plan = await workoutRepo.findPlanByPlayerAndTrainer({ playerId, trainerId });
  if (plan) return plan;

  try {
    plan = await workoutRepo.createPlayerPlan({ playerId, trainerId });
  } catch (err) {
    if (err.code !== 'P2002') throw err;
    plan = await workoutRepo.findPlanByPlayerAndTrainer({ playerId, trainerId });
  }

  if (!plan) {
    throw new AppError('Unable to create workout plan', 500);
  }

  return plan;
}

function assertTrainerOwnsPlan(plan, trainerId) {
  if (!plan?.playerId || plan.trainerId !== trainerId) {
    throw new AppError('You can manage plans only for players assigned to you', 403);
  }
}

function mapCatalogExercise(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrls: exercise.imageUrls,
    videoUrl: exercise.videoUrl,
    muscleGroup: exercise.muscleGroup,
    createdById: exercise.createdById,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

async function uploadExerciseImages({ trainerId, files }) {
  const uploads = await mediaUploadService.uploadImages({
    files,
    folder: '/workouts/exercises',
    tags: [`trainer:${trainerId}`],
  });

  return {
    imageUrls: uploads.map((upload) => upload.url),
    uploadedFileIds: uploads.map((upload) => upload.fileId),
  };
}

async function getAssignedPlan({ playerId, trainerId }) {
  const plan = await workoutRepo.findPlanByPlayerAndTrainer({ playerId, trainerId });
  return mapPlan(plan) ?? {
    id: null,
    slug: null,
    title: 'Workout plan',
    playerId,
    trainerId,
    days: [],
  };
}

async function getTrainerPlayerPlan({ trainerId, playerId }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  return getAssignedPlan({ playerId, trainerId });
}

async function listCatalogExercises({ muscleGroup }) {
  if (muscleGroup && !MUSCLE_GROUPS.has(muscleGroup)) {
    throw new AppError('Invalid muscleGroup filter', 400);
  }
  const exercises = await workoutRepo.listCatalogExercises(muscleGroup);
  return exercises.map(mapCatalogExercise);
}

async function createCatalogExercise({ trainerId, name, description, imageFiles, videoUrl, muscleGroup }) {
  let uploadedFileIds = [];
  try {
    const uploadResult = await uploadExerciseImages({ trainerId, files: imageFiles });
    uploadedFileIds = uploadResult.uploadedFileIds;

    const exercise = await workoutRepo.createCatalogExercise({
      name,
      description,
      imageUrls: uploadResult.imageUrls,
      videoUrl: videoUrl === '' ? null : videoUrl,
      muscleGroup,
      createdById: trainerId,
    });
    return mapCatalogExercise(exercise);
  } catch (err) {
    await mediaUploadService.deleteFilesByFileIds(uploadedFileIds);
    throw err;
  }
}

async function createDay({ trainerId, playerId, dayNumber, label }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  const plan = await ensurePlayerPlan({ playerId, trainerId });

  try {
    const day = await workoutRepo.createDay({
      planId: plan.id,
      dayNumber,
      label: label ?? null,
    });
    return {
      id: day.id,
      planId: day.planId,
      dayNumber: day.dayNumber,
      label: day.label,
    };
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError('A day with this number already exists in the plan', 409);
    }
    throw err;
  }
}

async function updateDay({ trainerId, dayId, dayNumber, label }) {
  const existing = await workoutRepo.findDayById(dayId);
  if (!existing) {
    throw new AppError('Day not found', 404);
  }
  assertTrainerOwnsPlan(existing.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.plan.playerId });

  const data = {};
  if (dayNumber !== undefined) data.dayNumber = dayNumber;
  if (label !== undefined) data.label = label;
  if (Object.keys(data).length === 0) {
    throw new AppError('No fields to update', 400);
  }
  try {
    const day = await workoutRepo.updateDay(dayId, data);
    return {
      id: day.id,
      planId: day.planId,
      dayNumber: day.dayNumber,
      label: day.label,
    };
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError('A day with this number already exists in the plan', 409);
    }
    throw err;
  }
}

async function deleteDay({ trainerId, dayId }) {
  const existing = await workoutRepo.findDayById(dayId);
  if (!existing) {
    throw new AppError('Day not found', 404);
  }
  assertTrainerOwnsPlan(existing.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.plan.playerId });

  await workoutRepo.deleteDay(dayId);
}

async function createExercise({ trainerId, dayId, name, description, imageFiles, videoUrl, muscleGroup, sortOrder }) {
  const day = await workoutRepo.findDayById(dayId);
  if (!day) {
    throw new AppError('Day not found', 404);
  }
  assertTrainerOwnsPlan(day.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: day.plan.playerId });

  let uploadedFileIds = [];
  try {
    const uploadResult = await uploadExerciseImages({ trainerId, files: imageFiles });
    uploadedFileIds = uploadResult.uploadedFileIds;

    const exercise = await workoutRepo.createExerciseAndCatalog({
      dayId,
      name,
      description,
      imageUrls: uploadResult.imageUrls,
      videoUrl: videoUrl === '' ? null : videoUrl,
      muscleGroup,
      sortOrder,
      createdById: trainerId,
    });

    return {
      id: exercise.id,
      dayId: exercise.dayId,
      name: exercise.name,
      description: exercise.description,
      imageUrls: exercise.imageUrls,
      videoUrl: exercise.videoUrl,
      muscleGroup: exercise.muscleGroup,
      sortOrder: exercise.sortOrder,
    };
  } catch (err) {
    await mediaUploadService.deleteFilesByFileIds(uploadedFileIds);
    throw err;
  }
}

async function createExerciseFromCatalog({ trainerId, dayId, sourceCatalogExerciseId, sourceExerciseId, sortOrder }) {
  const targetDay = await workoutRepo.findDayById(dayId);
  if (!targetDay) {
    throw new AppError('Day not found', 404);
  }
  assertTrainerOwnsPlan(targetDay.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: targetDay.plan.playerId });

  const catalogExerciseId = sourceCatalogExerciseId || sourceExerciseId;
  const sourceExercise = await workoutRepo.findCatalogExerciseById(catalogExerciseId);
  if (!sourceExercise) {
    throw new AppError('Catalog exercise not found', 404);
  }

  const exercise = await workoutRepo.createExercise({
    dayId,
    name: sourceExercise.name,
    description: sourceExercise.description,
    imageUrls: sourceExercise.imageUrls,
    videoUrl: sourceExercise.videoUrl,
    muscleGroup: sourceExercise.muscleGroup,
    sortOrder: sortOrder ?? 0,
  });
  return mapExercise(exercise);
}

async function updateExercise({ trainerId, exerciseId, payload }) {
  const existing = await workoutRepo.findExerciseById(exerciseId);
  if (!existing) {
    throw new AppError('Exercise not found', 404);
  }
  assertTrainerOwnsPlan(existing.day?.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.day.plan.playerId });

  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.imageUrls !== undefined) data.imageUrls = payload.imageUrls;
  if (payload.videoUrl !== undefined) {
    data.videoUrl = payload.videoUrl === '' ? null : payload.videoUrl;
  }
  if (payload.muscleGroup !== undefined) data.muscleGroup = payload.muscleGroup;
  if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder;
  if (Object.keys(data).length === 0) {
    throw new AppError('No fields to update', 400);
  }
  const exercise = await workoutRepo.updateExercise(exerciseId, data);
  return {
    id: exercise.id,
    dayId: exercise.dayId,
    name: exercise.name,
    description: exercise.description,
    imageUrls: exercise.imageUrls,
    videoUrl: exercise.videoUrl,
    muscleGroup: exercise.muscleGroup,
    sortOrder: exercise.sortOrder,
  };
}

async function deleteExercise({ trainerId, exerciseId }) {
  const existing = await workoutRepo.findExerciseById(exerciseId);
  if (!existing) {
    throw new AppError('Exercise not found', 404);
  }
  assertTrainerOwnsPlan(existing.day?.plan, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.day.plan.playerId });

  await workoutRepo.deleteExercise(exerciseId);
}

module.exports = {
  getAssignedPlan,
  getTrainerPlayerPlan,
  listCatalogExercises,
  createCatalogExercise,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  createExerciseFromCatalog,
  updateExercise,
  deleteExercise,
};
