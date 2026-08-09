const Joi = require('joi');

const updatePrivacyPolicySchema = Joi.object({
  content: Joi.string().trim().min(1).required(),
});

module.exports = {
  updatePrivacyPolicySchema,
};
