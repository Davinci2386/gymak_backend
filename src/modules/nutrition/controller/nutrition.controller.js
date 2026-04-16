const { ApiResponse } = require('../../../utils');
const nutritionService = require('../service/nutrition.service');

async function listMeals(req, res, next) {
  try {
    const data = await nutritionService.listCatalog(req.query.section);
    return ApiResponse.success(res, {
      message: 'Nutrition catalog',
      data,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMeal(req, res, next) {
  try {
    const result = await nutritionService.getMealById(req.params.mealId);
    return ApiResponse.success(res, {
      message: 'Meal',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function createMeal(req, res, next) {
  try {
    const result = await nutritionService.createMeal(req.body);
    return ApiResponse.created(res, {
      message: 'Meal created',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateMeal(req, res, next) {
  try {
    const result = await nutritionService.updateMeal(req.params.mealId, req.body);
    return ApiResponse.success(res, {
      message: 'Meal updated',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteMeal(req, res, next) {
  try {
    await nutritionService.deleteMeal(req.params.mealId);
    return ApiResponse.success(res, {
      message: 'Meal deleted',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
};
