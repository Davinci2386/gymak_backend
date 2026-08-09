const { prisma } = require('../../../config');

const assignedMealInclude = {
  ingredients: { orderBy: { sortOrder: 'asc' } },
};

const catalogMealInclude = {
  ingredients: { orderBy: { sortOrder: 'asc' } },
};

function mapIngredientCreateInput(ingredients) {
  return ingredients.map((ing, index) => ({
    name: ing.name,
    quantity: ing.quantity,
    calories: ing.calories,
    sortOrder: ing.sortOrder ?? index,
  }));
}

function findMealsForPlayerAndTrainer({ playerId, trainerId, section }) {
  return prisma.nutritionMeal.findMany({
    where: {
      playerId,
      trainerId,
      ...(section ? { section } : {}),
    },
    include: assignedMealInclude,
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  });
}

function findMealById(id) {
  return prisma.nutritionMeal.findUnique({
    where: { id },
    include: assignedMealInclude,
  });
}

function listCatalogMeals(section) {
  return prisma.nutritionCatalogMeal.findMany({
    where: section ? { section } : undefined,
    include: catalogMealInclude,
    orderBy: [{ section: 'asc' }, { name: 'asc' }, { createdAt: 'desc' }],
  });
}

function findCatalogMealById(id) {
  return prisma.nutritionCatalogMeal.findUnique({
    where: { id },
    include: catalogMealInclude,
  });
}

function createCatalogMeal({ section, name, imageUrl, calories, ingredients, createdById }) {
  return prisma.nutritionCatalogMeal.create({
    data: {
      section,
      name,
      imageUrl,
      calories,
      createdById: createdById ?? null,
      ingredients: {
        create: mapIngredientCreateInput(ingredients),
      },
    },
    include: catalogMealInclude,
  });
}

function createMeal({ playerId, trainerId, section, name, imageUrl, calories, ingredients }) {
  return prisma.nutritionMeal.create({
    data: {
      playerId,
      trainerId,
      section,
      name,
      imageUrl,
      calories,
      ingredients: {
        create: mapIngredientCreateInput(ingredients),
      },
    },
    include: assignedMealInclude,
  });
}

function createMealAndCatalog({ playerId, trainerId, section, name, imageUrl, calories, ingredients, createdById }) {
  return prisma.$transaction(async (tx) => {
    const meal = await tx.nutritionMeal.create({
      data: {
        playerId,
        trainerId,
        section,
        name,
        imageUrl,
        calories,
        ingredients: {
          create: mapIngredientCreateInput(ingredients),
        },
      },
      include: assignedMealInclude,
    });

    await tx.nutritionCatalogMeal.create({
      data: {
        section,
        name,
        imageUrl,
        calories,
        createdById: createdById ?? null,
        ingredients: {
          create: mapIngredientCreateInput(ingredients),
        },
      },
      include: catalogMealInclude,
    });

    return meal;
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
            create: mapIngredientCreateInput(ingredients),
          },
        },
        include: assignedMealInclude,
      });
    });
  }

  return prisma.nutritionMeal.update({
    where: { id },
    data: scalars,
    include: assignedMealInclude,
  });
}

function deleteMeal(id) {
  return prisma.nutritionMeal.delete({ where: { id } });
}

module.exports = {
  findMealsForPlayerAndTrainer,
  findMealById,
  listCatalogMeals,
  findCatalogMealById,
  createCatalogMeal,
  createMeal,
  createMealAndCatalog,
  updateMeal,
  deleteMeal,
};
