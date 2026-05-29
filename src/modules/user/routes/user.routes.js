const { Router } = require('express');
const { validate, auth } = require('../../../middleware');
const { registerSchema, loginSchema, refreshSchema, updateMeSchema } = require('../validators/auth.schemas');
const authController = require('../controller/auth.controller');
const meController = require('../controller/me.controller');
const uploadProfileImages = require('../middleware/uploadProfileImages');

const router = Router();

router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', validate(refreshSchema), authController.refresh);
router.post('/auth/logout', validate(refreshSchema), authController.logout);

router.get('/me', auth, meController.me);
router.put('/me', auth, validate(updateMeSchema), meController.updateMe);
router.patch('/me/profile-images', auth, uploadProfileImages.array('images', 10), meController.updateProfileImages);
router.delete('/me', auth, meController.deleteMe);

module.exports = router;
