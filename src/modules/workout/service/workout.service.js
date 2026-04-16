const { AppError } = require('../../../shared/errors');
const workoutRepo = require('../repository/workout.repository');

const DEFAULT_PLAN_SLUG = 'default';

function mapPlan(plan) {
  if (!plan) return null;
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    days: (plan.days || []).map((d) => ({
      id: d.id,
      dayNumber: d.dayNumber,
      label: d.label,
      exercises: (d.exercises || []).map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        imageUrls: e.imageUrls,
        videoUrl: e.videoUrl,
        sortOrder: e.sortOrder,
      })),
    })),
  };
}

async function getPublicPlan() {
  const plan = await workoutRepo.findPlanBySlug(DEFAULT_PLAN_SLUG);
  if (!plan) {
    throw new AppError('Workout plan not found', 404);
  }
  return mapPlan(plan);
}

async function createDay({ dayNumber, label }) {
  const plan = await workoutRepo.findPlanBySlug(DEFAULT_PLAN_SLUG);
  if (!plan) {
    throw new AppError('Workout plan not found', 404);
  }
  try {
    const day = await workoutRepo.createDay({
      planId: plan.id,
      dayNumber,
      label: label ?? null,
    });
    return {
      id: day.id,
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

async function updateDay(dayId, { dayNumber, label }) {
  const existing = await workoutRepo.findDayById(dayId);
  if (!existing) {
    throw new AppError('Day not found', 404);
  }
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

async function deleteDay(dayId) {
  const existing = await workoutRepo.findDayById(dayId);
  if (!existing) {
    throw new AppError('Day not found', 404);
  }
  await workoutRepo.deleteDay(dayId);
}

async function createExercise(dayId, { name, description, imageUrls, videoUrl, sortOrder }) {
  const day = await workoutRepo.findDayById(dayId);
  if (!day) {
    throw new AppError('Day not found', 404);
  }
  const exercise = await workoutRepo.createExercise({
    dayId,
    name,
    description,
    imageUrls,
    videoUrl: videoUrl === '' ? null : videoUrl,
    sortOrder,
  });
  return {
    id: exercise.id,
    dayId: exercise.dayId,
    name: exercise.name,
    description: exercise.description,
    imageUrls: exercise.imageUrls,
    videoUrl: exercise.videoUrl,
    sortOrder: exercise.sortOrder,
  };
}

async function updateExercise(exerciseId, payload) {
  const existing = await workoutRepo.findExerciseById(exerciseId);
  if (!existing) {
    throw new AppError('Exercise not found', 404);
  }
  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.imageUrls !== undefined) data.imageUrls = payload.imageUrls;
  if (payload.videoUrl !== undefined) {
    data.videoUrl = payload.videoUrl === '' ? null : payload.videoUrl;
  }
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
    sortOrder: exercise.sortOrder,
  };
}

async function deleteExercise(exerciseId) {
  const existing = await workoutRepo.findExerciseById(exerciseId);
  if (!existing) {
    throw new AppError('Exercise not found', 404);
  }
  await workoutRepo.deleteExercise(exerciseId);
}

module.exports = {
  getPublicPlan,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  updateExercise,
  deleteExercise,
};
