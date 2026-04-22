const Joi = require('joi');

const createPlanSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow(null),
  price: Joi.number().integer().min(100).required(), // بـ cents
  durationDays: Joi.number().integer().min(1).required(),
  features: Joi.array().items(Joi.string()).optional(),
});

const updatePlanSchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow(null),
  price: Joi.number().integer().min(100).optional(),
  durationDays: Joi.number().integer().min(1).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const createPaymentIntentSchema = Joi.object({
  planId: Joi.string().uuid().required(),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  createPaymentIntentSchema,
};
