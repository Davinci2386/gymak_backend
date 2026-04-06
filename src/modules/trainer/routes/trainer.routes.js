const { Router } = require('express');
const trainerController = require('../controller/trainer.controller');
const { validate } = require('../../../middleware');
const { trainerRegisterSchema } = require('../validators/trainerAuth.schemas');
const trainerAuthController = require('../controller/trainerAuth.controller');
const upload = require('../middleware/uploadCertificates');

const router = Router();

// Public list of trainers (player can choose one)
router.get('/', trainerController.list);

// Trainer registration (multipart/form-data, optional certificates[])
router.post(
  '/auth/register',
  upload.array('certificates', 10),
  validate(trainerRegisterSchema),
  trainerAuthController.register,
);

module.exports = router;
