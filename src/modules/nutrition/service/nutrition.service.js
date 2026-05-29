const { AppError } = require('../../../shared/errors');
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

function mapMeal(meal) {
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

function emptySectionsShape() {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
  };
}

function groupMealsBySection(meals) {
  const grouped = emptySectionsShape();
  for (const m of meals) {
    const key = SECTION_TO_API_KEY[m.section];
    grouped[key].push(mapMeal(m));
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
    return { meals: meals.map(mapMeal) };
  }

  return { sections: groupMealsBySection(meals) };
}

async function listTrainerPlayerMeals({ trainerId, playerId, querySection }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  return listAssignedMeals({ playerId, trainerId, querySection });
}

async function getMealForPlayer({ mealId, playerId, trainerId }) {
  const meal = await nutritionRepo.findMealById(mealId);
  assertPlayerCanAccessMeal(meal, { playerId, trainerId });
  return { meal: mapMeal(meal) };
}

async function createMeal({ trainerId, playerId, payload }) {
  await ensureTrainerAssignedToPlayer({ trainerId, playerId });
  const meal = await nutritionRepo.createMeal({
    playerId,
    trainerId,
    section: payload.section,
    name: payload.name,
    imageUrl: payload.imageUrl,
    calories: payload.calories,
    ingredients: payload.ingredients,
  });
  return { meal: mapMeal(meal) };
}

async function updateMeal({ trainerId, mealId, payload }) {
  const existing = await nutritionRepo.findMealById(mealId);
  if (!existing) {
    throw new AppError('Meal not found', 404);
  }
  assertTrainerOwnsMeal(existing, trainerId);
  await ensureTrainerAssignedToPlayer({ trainerId, playerId: existing.playerId });

  const meal = await nutritionRepo.updateMeal(mealId, payload);
  return { meal: mapMeal(meal) };
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
  getMealForPlayer,
  createMeal,
  updateMeal,
  deleteMeal,
};
