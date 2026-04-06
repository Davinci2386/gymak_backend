const { Router } = require('express');
const { validate, auth } = require('../../../middleware');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.schemas');
const authController = require('../controller/auth.controller');
const meController = require('../controller/me.controller');

const router = Router();

router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', validate(refreshSchema), authController.refresh);
router.post('/auth/logout', validate(refreshSchema), authController.logout);

router.get('/me', auth, meController.me);

module.exports = router;
