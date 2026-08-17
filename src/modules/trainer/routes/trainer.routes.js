const { Router } = require('express');
const trainerController = require('../controller/trainer.controller');
const { validate } = require('../../../middleware');
const { trainerRegisterSchema, trainerLoginSchema } = require('../validators/trainerAuth.schemas');
const trainerAuthController = require('../controller/trainerAuth.controller');
const upload = require('../middleware/uploadCertificates');

const router = Router();

// Public list of trainers (player can choose one)
router.get('/', trainerController.list);
router.get('/:trainerId', trainerController.getById);

// Trainer registration (application/json with optional string certificates[]).
// Multipart file uploads remain temporarily supported for older clients.
router.post(
  '/auth/register',
  upload.array('certificates', 10),
  validate(trainerRegisterSchema),
  trainerAuthController.register,
);

router.post('/auth/login', validate(trainerLoginSchema), trainerAuthController.login);

module.exports = router;
