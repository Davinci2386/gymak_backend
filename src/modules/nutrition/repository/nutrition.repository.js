const { prisma } = require('../../../config');

const ingredientOrder = { orderBy: { sortOrder: 'asc' } };

const mealInclude = {
  ingredients: ingredientOrder,
};

function findAllMealsWithIngredients() {
  return prisma.nutritionMeal.findMany({
    include: mealInclude,
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  });
}

function findMealsBySection(section) {
  return prisma.nutritionMeal.findMany({
    where: { section },
    include: mealInclude,
    orderBy: { name: 'asc' },
  });
}

function findMealById(id) {
  return prisma.nutritionMeal.findUnique({
    where: { id },
    include: mealInclude,
  });
}

function createMeal({ section, name, imageUrl, calories, ingredients }) {
  return prisma.nutritionMeal.create({
    data: {
      section,
      name,
      imageUrl,
      calories,
      ingredients: {
        create: ingredients.map((ing, index) => ({
          name: ing.name,
          quantity: ing.quantity,
          calories: ing.calories,
          sortOrder: ing.sortOrder ?? index,
        })),
      },
    },
    include: mealInclude,
  });
}

function updateMeal(id, { name, imageUrl, calories, section, ingredients }) {
  const scalars = {};
  if (name !== undefined) scalars.name = name;
  if (imageUrl !== undefined) scalars.imageUrl = imageUrl;
  if (calories !== undefined) scalars.calories = calories;
  if (section !== undefined) scalars.section = section;

  if (ingredients !== undefined) {
    return prisma.$transaction(async (tx) => {
      await tx.nutritionIngredient.deleteMany({ where: { mealId: id } });
      return tx.nutritionMeal.update({
        where: { id },
        data: {
          ...scalars,
          ingredients: {
            create: ingredients.map((ing, index) => ({
              name: ing.name,
              quantity: ing.quantity,
              calories: ing.calories,
              sortOrder: ing.sortOrder ?? index,
            })),
          },
        },
        include: mealInclude,
      });
    });
  }

  return prisma.nutritionMeal.update({
    where: { id },
    data: scalars,
    include: mealInclude,
  });
}

function deleteMeal(id) {
  return prisma.nutritionMeal.delete({ where: { id } });
}

module.exports = {
  findAllMealsWithIngredients,
  findMealsBySection,
  findMealById,
  createMeal,
  updateMeal,
  deleteMeal,
};
