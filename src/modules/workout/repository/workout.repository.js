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

function findPlanByPlayerAndTrainer({ playerId, trainerId }) {
  return prisma.workoutPlan.findFirst({
    where: { playerId, trainerId },
    include: planInclude,
  });
}

function createPlayerPlan({ playerId, trainerId, title }) {
  return prisma.workoutPlan.create({
    data: {
      slug: `player-${playerId}-trainer-${trainerId}`,
      title: title ?? 'Workout plan',
      playerId,
      trainerId,
    },
    include: planInclude,
  });
}

function findDayById(id) {
  return prisma.workoutDay.findUnique({
    where: { id },
    include: {
      plan: true,
      exercises: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

function listCatalogExercises(muscleGroup) {
  return prisma.workoutCatalogExercise.findMany({
    where: muscleGroup ? { muscleGroup } : undefined,
    orderBy: [
      { muscleGroup: 'asc' },
      { name: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

function findCatalogExerciseById(id) {
  return prisma.workoutCatalogExercise.findUnique({
    where: { id },
  });
}

function createCatalogExercise({ name, description, imageUrls, videoUrl, muscleGroup, createdById }) {
  return prisma.workoutCatalogExercise.create({
    data: {
      name,
      description: description ?? '',
      imageUrls: imageUrls ?? [],
      videoUrl: videoUrl ?? null,
      muscleGroup,
      createdById: createdById ?? null,
    },
  });
}

function findExerciseById(id) {
  return prisma.workoutExercise.findUnique({
    where: { id },
    include: {
      day: {
        include: { plan: true },
      },
    },
  });
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

function createExercise({ dayId, name, description, imageUrls, videoUrl, muscleGroup, sortOrder }) {
  return prisma.workoutExercise.create({
    data: {
      dayId,
      name,
      description: description ?? '',
      imageUrls: imageUrls ?? [],
      videoUrl: videoUrl ?? null,
      muscleGroup,
      sortOrder: sortOrder ?? 0,
    },
  });
}

function createExerciseAndCatalog({
  dayId,
  name,
  description,
  imageUrls,
  videoUrl,
  muscleGroup,
  sortOrder,
  createdById,
}) {
  return prisma.$transaction(async (tx) => {
    const exercise = await tx.workoutExercise.create({
      data: {
        dayId,
        name,
        description: description ?? '',
        imageUrls: imageUrls ?? [],
        videoUrl: videoUrl ?? null,
        muscleGroup,
        sortOrder: sortOrder ?? 0,
      },
    });

    await tx.workoutCatalogExercise.create({
      data: {
        name,
        description: description ?? '',
        imageUrls: imageUrls ?? [],
        videoUrl: videoUrl ?? null,
        muscleGroup,
        createdById: createdById ?? null,
      },
    });

    return exercise;
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
  findPlanByPlayerAndTrainer,
  createPlayerPlan,
  findDayById,
  listCatalogExercises,
  findCatalogExerciseById,
  createCatalogExercise,
  findExerciseById,
  createDay,
  updateDay,
  deleteDay,
  createExercise,
  createExerciseAndCatalog,
  updateExercise,
  deleteExercise,
};
