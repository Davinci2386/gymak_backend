const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const nutritionController = require('../controller/nutrition.controller');
const { createMealSchema, updateMealSchema } = require('../validators/nutrition.schemas');

const router = Router();

/** Public: list meals (all sections grouped, or filter with ?section=breakfast|lunch|dinner). */
router.get('/meals', nutritionController.listMeals);
router.get('/meals/:mealId', nutritionController.getMeal);

const trainer = [auth, authorize('TRAINER')];

router.post('/meals', trainer, validate(createMealSchema), nutritionController.createMeal);
router.put('/meals/:mealId', trainer, validate(updateMealSchema), nutritionController.updateMeal);
router.delete('/meals/:mealId', trainer, nutritionController.deleteMeal);

module.exports = router;
