const Joi = require('joi');

const createRequestSchema = Joi.object({
  trainerId: Joi.string().uuid().required(),
});

const requestActionSchema = Joi.object({
  requestId: Joi.string().uuid().required(),
});

module.exports = { createRequestSchema, requestActionSchema };

