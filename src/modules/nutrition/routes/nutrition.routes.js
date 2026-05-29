const { Router } = require('express');
const { auth, authorize, requireActiveAssignment, validate } = require('../../../middleware');
const nutritionController = require('../controller/nutrition.controller');
const { createMealSchema, updateMealSchema } = require('../validators/nutrition.schemas');

const router = Router();

router.get('/meals', auth, authorize('USER'), requireActiveAssignment, nutritionController.listMeals);
router.get('/meals/:mealId', auth, authorize('USER'), requireActiveAssignment, nutritionController.getMeal);

const trainer = [auth, authorize('TRAINER')];

router.get('/players/:playerId/meals', trainer, nutritionController.listTrainerPlayerMeals);
router.post('/players/:playerId/meals', trainer, validate(createMealSchema), nutritionController.createMeal);
router.put('/meals/:mealId', trainer, validate(updateMealSchema), nutritionController.updateMeal);
router.delete('/meals/:mealId', trainer, nutritionController.deleteMeal);

module.exports = router;
