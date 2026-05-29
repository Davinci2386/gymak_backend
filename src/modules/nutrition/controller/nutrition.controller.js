const { ApiResponse } = require('../../../utils');
const nutritionService = require('../service/nutrition.service');

async function listMeals(req, res, next) {
  try {
    const data = await nutritionService.listAssignedMeals({
      playerId: req.user.id,
      trainerId: req.assignment.trainerId,
      querySection: req.query.section,
    });
    return ApiResponse.success(res, {
      message: 'Nutrition plan',
      data,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMeal(req, res, next) {
  try {
    const result = await nutritionService.getMealForPlayer({
      mealId: req.params.mealId,
      playerId: req.user.id,
      trainerId: req.assignment.trainerId,
    });
    return ApiResponse.success(res, {
      message: 'Meal',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function listTrainerPlayerMeals(req, res, next) {
  try {
    const data = await nutritionService.listTrainerPlayerMeals({
      trainerId: req.user.id,
      playerId: req.params.playerId,
      querySection: req.query.section,
    });
    return ApiResponse.success(res, {
      message: 'Nutrition plan',
      data,
    });
  } catch (err) {
    return next(err);
  }
}

async function createMeal(req, res, next) {
  try {
    const result = await nutritionService.createMeal({
      trainerId: req.user.id,
      playerId: req.params.playerId,
      payload: req.body,
    });
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
    const result = await nutritionService.updateMeal({
      trainerId: req.user.id,
      mealId: req.params.mealId,
      payload: req.body,
    });
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
    await nutritionService.deleteMeal({
      trainerId: req.user.id,
      mealId: req.params.mealId,
    });
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
  listTrainerPlayerMeals,
  createMeal,
  updateMeal,
  deleteMeal,
};
