const { ApiResponse } = require('../../../utils');
const privacyPolicyService = require('../service/privacyPolicy.service');

async function getPrivacyPolicy(_req, res, next) {
  try {
    const privacyPolicy = await privacyPolicyService.getPrivacyPolicy();
    return ApiResponse.success(res, {
      message: 'Privacy policy',
      data: { privacyPolicy },
    });
  } catch (err) {
    return next(err);
  }
}

async function updatePrivacyPolicy(req, res, next) {
  try {
    const privacyPolicy = await privacyPolicyService.updatePrivacyPolicy(req.body.content);
    return ApiResponse.success(res, {
      message: 'Privacy policy updated',
      data: { privacyPolicy },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPrivacyPolicy,
  updatePrivacyPolicy,
};
