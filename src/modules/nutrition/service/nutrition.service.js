const { AppError } = require('../../../shared/errors');
const mediaUploadService = require('../../../shared/services/mediaUpload.service');
const assignmentRepo = require('../../subscription/repository/assignment.repository');
const nutritionRepo = require('../repository/nutrition.repository');
const { SECTION_FROM_QUERY, SECTION_TO_API_KEY } = require('../constants/sections');

function mapIngredient(ing) {
  return {
    id: ing.id,
    name: ing.name,
    quantity: ing.quantity,
    calories: ing.calories,
    sortOrder: ing.sortOrder,
  };
}

function mapAssignedMeal(meal) {
  return {
    id: meal.id,
    playerId: meal.playerId,
    trainerId: meal.trainerId,
    section: SECTION_TO_API_KEY[meal.section],
    name: meal.name,
    imageUrl: meal.imageUrl,
    calories: meal.calories,
    ingredients: (meal.ingredients || []).map(mapIngredient),
  };
}

function mapCatalogMeal(meal) {
  return {
    id: meal.id,
    section: SECTION_TO_API_KEY[meal.section],
    name: meal.name,
    imageUrl: meal.imageUrl,
    calories: meal.calories,
    createdById: meal.createdById,
    ingredients: (meal.ingredients || []).map(mapIngredient),
  };
}

function emptySectionsShape() {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
  };
}

function groupMealsBySection(meals, mapper) {
  const grouped = emptySectionsShape();
  for (const meal of meals) {
    const key = SECTION_TO_API_KEY[meal.section];
    grouped[key].push(mapper(meal));
  }
  return grouped;
}

function parseSection(querySection) {
  if (!querySection) return null;
  const prismaSection = SECTION_FROM_QUERY[querySection.toLowerCase()];
  if (!prismaSection) {
    throw new AppError('Invalid section. Use breakfast, lunch, or dinner.', 400);
  }
  return prismaSection;
}

async function uploadMealImage({ trainerId, file }) {
  if (!file) {
    throw new AppError('Meal image file is required', 400);
  }

  return mediaUploadService.uploadImage({
    file,
    folder: '/nutrition/meals',
    tags: [`trainer:${trainerId}`],
  });
}

async function ensureTrainerAssignedToPlayer({ trainerId, playerId }) {
  const assignment = await assignmentRepo.findActiveAssignmentBetween({ playerId, trainerId });
  if (!assignment) {
    throw new AppError('You can manage plans only for players assigned to you', 403);
  }
  return assignment;
}

function assertTrainerOwnsMeal(meal, trainerId) {
  if (!meal?.playerId || meal.trainerId !== trainerId) {
    throw new AppError('You can manage plans only for players assigned to you', 403);
  }
}

function assertPlayerCanAccessMeal(meal, { playerId, trainerId }) {
  if (!meal || meal.playerId !== playerId || meal.trainerId !== trainerId) {
    throw new AppError('Meal not found', 404);
  }
}

async function listAssignedMeals({ playerId, trainerId, querySection }) {
  const section = parseSection(querySection);
  const meals = await nutritionRepo.findMealsForPlayerAndTrainer({ playerId, trainerId, section });

  if (section) {
    return { meals: meals.map(mapAssignedMeal) };
  }

  return { sections: groupMealsBySection(meals, mapAssignedMeal) };
}

async function listTrainerPlayerMeals({ trainerId, playerId, querySection }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  return listAssignedMeals({ playerId, trainerId, querySection });
}

async function listCatalogMeals({ querySection }) {
  const section = parseSection(querySection);
  const meals = await nutritionRepo.listCatalogMeals(section);

  if (section) {
    return { meals: meals.map(mapCatalogMeal) };
  }

  return { sections: groupMealsBySection(meals, mapCatalogMeal) };
}

async function createCatalogMeal({ trainerId, payload, imageFile }) {
  let uploadedFileId = null;
  try {
    const upload = await uploadMealImage({ trainerId, file: imageFile });
    uploadedFileId = upload.fileId;

    const meal = await nutritionRepo.createCatalogMeal({
      section: payload.section,
      name: payload.name,
      imageUrl: upload.url,
      calories: payload.calories,
      ingredients: payload.ingredients,
      createdById: trainerId,
    });

    return { meal: mapCatalogMeal(meal) };
  } catch (err) {
    await mediaUploadService.deleteFileByFileId(uploadedFileId);
    throw err;
  }
}

async function getMealForPlayer({ mealId, playerId, trainerId }) {
  const meal = await nutritionRepo.findMealById(mealId);
  assertPlayerCanAccessMeal(meal, { playerId, trainerId });
  return { meal: mapAssignedMeal(meal) };
}

async function createMeal({ trainerId, playerId, payload, imageFile }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  let uploadedFileId = null;
  try {
    const upload = await uploadMealImage({ trainerId, file: imageFile });
    uploadedFileId = upload.fileId;

    const meal = await nutritionRepo.createMealAndCatalog({
      playerId,
      trainerId,
      section: payload.section,
      name: payload.name,
      imageUrl: upload.url,
      calories: payload.calories,
      ingredients: payload.ingredients,
      createdById: trainerId,
    });

    return { meal: mapAssignedMeal(meal) };
  } catch (err) {
    await mediaUploadService.deleteFileByFileId(uploadedFileId);
    throw err;
  }
}

async function createMealFromCatalog({ trainerId, playerId, sourceCatalogMealId, sourceMealId }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });

  const catalogMealId = sourceCatalogMealId || sourceMealId;
  const sourceMeal = await nutritionRepo.findCatalogMealById(catalogMealId);
  if (!sourceMeal) {
    throw new AppError('Catalog meal not found', 404);
  }

  const meal = await nutritionRepo.createMeal({
    playerId,
    trainerId,
    section: sourceMeal.section,
    name: sourceMeal.name,
    imageUrl: sourceMeal.imageUrl,
    calories: sourceMeal.calories,
    ingredients: sourceMeal.ingredients,
  });

  return { meal: mapAssignedMeal(meal) };
}

async function updateMeal({ trainerId, mealId, payload }) {
  const existing = await nutritionRepo.findMealById(mealId);
  if (!existing) {
    throw new AppError('Meal not found', 404);
  }
  assertTrainerOwnsMeal(existing, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.playerId });

  const meal = await nutritionRepo.updateMeal(mealId, payload);
  return { meal: mapAssignedMeal(meal) };
}

async function deleteMeal({ trainerId, mealId }) {
  const existing = await nutritionRepo.findMealById(mealId);
  if (!existing) {
    throw new AppError('Meal not found', 404);
  }
  assertTrainerOwnsMeal(existing, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.playerId });

  await nutritionRepo.deleteMeal(mealId);
}

module.exports = {
  listAssignedMeals,
  listTrainerPlayerMeals,
  listCatalogMeals,
  createCatalogMeal,
  getMealForPlayer,
  createMeal,
  createMealFromCatalog,
  updateMeal,
  deleteMeal,
};
