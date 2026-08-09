const { Router } = require('express');
const privacyPolicyController = require('../controller/privacyPolicy.controller');

const router = Router();

// Public route: no authentication is required to read the current policy.
router.get('/', privacyPolicyController.getPrivacyPolicy);

module.exports = router;
