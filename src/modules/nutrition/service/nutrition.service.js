const { AppError } = require('../../../shared/errors');
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

async function listCatalog(querySection) {
  if (!querySection) {
    const meals = await nutritionRepo.findAllMealsWithIngredients();
    return { sections: groupMealsBySection(meals) };
  }

  const prismaSection = SECTION_FROM_QUERY[querySection.toLowerCase()];
  if (!prismaSection) {
    throw new AppError('Invalid section. Use breakfast, lunch, or dinner.', 400);
  }

  const meals = await nutritionRepo.findMealsBySection(prismaSection);
  return { meals: meals.map(mapMeal) };
}

async function getMealById(mealId) {
  const meal = await nutritionRepo.findMealById(mealId);
  if (!meal) {
    throw new AppError('Meal not found', 404);
  }
  return { meal: mapMeal(meal) };
}

async function createMeal(payload) {
  const meal = await nutritionRepo.createMeal({
    section: payload.section,
    name: payload.name,
    imageUrl: payload.imageUrl,
    calories: payload.calories,
    ingredients: payload.ingredients,
  });
  return { meal: mapMeal(meal) };
}

async function updateMeal(mealId, payload) {
  const existing = await nutritionRepo.findMealById(mealId);
  if (!existing) {
    throw new AppError('Meal not found', 404);
  }
  const meal = await nutritionRepo.updateMeal(mealId, payload);
  return { meal: mapMeal(meal) };
}

async function deleteMeal(mealId) {
  const existing = await nutritionRepo.findMealById(mealId);
  if (!existing) {
    throw new AppError('Meal not found', 404);
  }
  await nutritionRepo.deleteMeal(mealId);
}

module.exports = {
  listCatalog,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
};
