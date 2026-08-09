const { Router } = require('express');
const { auth, authorize, requireActiveAssignment, validate } = require('../../../middleware');
const workoutController = require('../controller/workout.controller');
const uploadExerciseImages = require('../middleware/uploadExerciseImages');
const {
  createDaySchema,
  updateDaySchema,
  createCatalogExerciseSchema,
  createExerciseSchema,
  updateExerciseSchema,
  addExerciseFromCatalogSchema,
} = require('../validators/workout.schemas');

const router = Router();

router.get('/plan', auth, authorize('USER'), requireActiveAssignment, workoutController.getWorkoutPlan);

const trainer = [auth, authorize('TRAINER')];

router.get('/catalog/exercises', trainer, workoutController.listCatalogExercises);
router.post(
  '/catalog/exercises',
  trainer,
  uploadExerciseImages.array('images', 10),
  validate(createCatalogExerciseSchema),
  workoutController.createCatalogExercise,
);

router.get('/players/:playerId/plan', trainer, workoutController.getTrainerPlayerPlan);
router.post('/players/:playerId/days', trainer, validate(createDaySchema), workoutController.createDay);
router.put('/days/:dayId', trainer, validate(updateDaySchema), workoutController.updateDay);
router.delete('/days/:dayId', trainer, workoutController.deleteDay);

router.post(
  '/days/:dayId/exercises',
  trainer,
  uploadExerciseImages.array('images', 10),
  validate(createExerciseSchema),
  workoutController.createExercise,
);
router.post(
  '/days/:dayId/exercises/from-catalog',
  trainer,
  validate(addExerciseFromCatalogSchema),
  workoutController.createExerciseFromCatalog,
);
router.put(
  '/exercises/:exerciseId',
  trainer,
  validate(updateExerciseSchema),
  workoutController.updateExercise,
);
router.delete('/exercises/:exerciseId', trainer, workoutController.deleteExercise);

module.exports = router;
