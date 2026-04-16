const { prisma } = require('../../../config');

const planInclude = {
  days: {
    orderBy: { dayNumber: 'asc' },
    include: {
      exercises: { orderBy: { sortOrder: 'asc' } },
    },
  },
};

function findPlanBySlug(slug) {
  return prisma.workoutPlan.findUnique({
    where: { slug },
    include: planInclude,
  });
}

function findDayById(id) {
  return prisma.workoutDay.findUnique({
    where: { id },
    include: { plan: true },
  });
}

function findExerciseById(id) {
  return prisma.workoutExercise.findUnique({ where: { id } });
}

function createDay({ planId, dayNumber, label }) {
  return prisma.workoutDay.create({
    data: { planId, dayNumber, label },
  });
}

function updateDay(id, data) {
  return prisma.workoutDay.update({ where: { id }, data });
}

function deleteDay(id) {
  return prisma.workoutDay.delete({ where: { id } });
}

function createExercise({ dayId, name, description, imageUrls, videoUrl, sortOrder }) {
  return prisma.workoutExercise.create({
    data: {
      dayId,
      name,
      description: description ?? '',
      imageUrls: imageUrls ?? [],
      videoUrl: videoUrl ?? null,
      sortOrder: sortOrder ?? 0,
    },
  });
}

function updateExercise(id, data) {
  return prisma.workoutExercise.update({ where: { id }, data });
}

function deleteExercise(id) {
  return prisma.workoutExercise.delete({ where: { id } });
}

module.exports = {
  findPlanBySlug,
  findDayById,
  findExerciseById,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  updateExercise,
  deleteExercise,
};
