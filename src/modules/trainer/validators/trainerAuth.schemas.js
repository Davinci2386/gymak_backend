const Joi = require('joi');

const trainerRegisterSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  gender: Joi.string().valid('MALE', 'FEMALE').required(),
  description: Joi.string().trim().max(2000).allow('', null),
  birthDate: Joi.date().iso().required(),
});

const trainerLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

module.exports = { trainerRegisterSchema, trainerLoginSchema };
