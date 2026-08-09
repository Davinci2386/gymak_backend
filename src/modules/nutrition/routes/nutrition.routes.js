const { Router } = require('express');
const { auth, authorize, requireActiveAssignment, validate } = require('../../../middleware');
const nutritionController = require('../controller/nutrition.controller');
const uploadMealImage = require('../middleware/uploadMealImage');
const parseMealMultipartBody = require('../middleware/parseMealMultipartBody');
const {
  createCatalogMealSchema,
  createMealSchema,
  updateMealSchema,
  addMealFromCatalogSchema,
} = require('../validators/nutrition.schemas');

const router = Router();

router.get('/meals', auth, authorize('USER'), requireActiveAssignment, nutritionController.listMeals);
router.get('/meals/:mealId', auth, authorize('USER'), requireActiveAssignment, nutritionController.getMeal);

const trainer = [auth, authorize('TRAINER')];

router.get('/catalog/meals', trainer, nutritionController.listCatalogMeals);
router.post(
  '/catalog/meals',
  trainer,
  uploadMealImage.single('image'),
  parseMealMultipartBody,
  validate(createCatalogMealSchema),
  nutritionController.createCatalogMeal,
);
router.get('/players/:playerId/meals', trainer, nutritionController.listTrainerPlayerMeals);
router.post(
  '/players/:playerId/meals',
  trainer,
  uploadMealImage.single('image'),
  parseMealMultipartBody,
  validate(createMealSchema),
  nutritionController.createMeal,
);
router.post(
  '/players/:playerId/meals/from-catalog',
  trainer,
  validate(addMealFromCatalogSchema),
  nutritionController.createMealFromCatalog,
);
router.put('/meals/:mealId', trainer, validate(updateMealSchema), nutritionController.updateMeal);
router.delete('/meals/:mealId', trainer, nutritionController.deleteMeal);

module.exports = router;
