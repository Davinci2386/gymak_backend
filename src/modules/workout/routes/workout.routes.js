const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const workoutController = require('../controller/workout.controller');
const {
  createDaySchema,
  updateDaySchema,
  createExerciseSchema,
  updateExerciseSchema,
} = require('../validators/workout.schemas');

const router = Router();

/** Public: multi-day plan with exercises from the database. */
router.get('/plan', workoutController.getWorkoutPlan);

const trainer = [auth, authorize('TRAINER')];

router.post('/days', trainer, validate(createDaySchema), workoutController.createDay);
router.put('/days/:dayId', trainer, validate(updateDaySchema), workoutController.updateDay);
router.delete('/days/:dayId', trainer, workoutController.deleteDay);

router.post(
  '/days/:dayId/exercises',
  trainer,
  validate(createExerciseSchema),
  workoutController.createExercise,
);
router.put(
  '/exercises/:exerciseId',
  trainer,
  validate(updateExerciseSchema),
  workoutController.updateExercise,
);
router.delete('/exercises/:exerciseId', trainer, workoutController.deleteExercise);

module.exports = router;
