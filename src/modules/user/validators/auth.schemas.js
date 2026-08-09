const Joi = require('joi');

const trainTimeSchema = Joi.string().trim().pattern(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
const nullableProfileTextSchema = Joi.string().trim().max(2000).allow(null);
const nonNegativeNumberSchema = Joi.number().min(0);

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  gender: Joi.string().valid('MALE', 'FEMALE').required(),
  birthDate: Joi.date().iso().required(),
  goals: Joi.array().items(Joi.string().trim().min(1)).default([]),
  hasRoutine: Joi.boolean().default(false),
  trainTime: trainTimeSchema.allow(null),
  heightCm: nonNegativeNumberSchema.default(0),
  weightKg: nonNegativeNumberSchema.default(0),
  medical_condition: nullableProfileTextSchema,
  injuries: nullableProfileTextSchema,
  medications: nullableProfileTextSchema,
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(20).required(),
});

const updateMeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().trim().email(),
  gender: Joi.string().valid('MALE', 'FEMALE'),
  birthDate: Joi.date().iso(),
  goals: Joi.array().items(Joi.string().trim().min(1)),
  hasRoutine: Joi.boolean(),
  trainTime: trainTimeSchema.allow(null),
  heightCm: nonNegativeNumberSchema,
  weightKg: nonNegativeNumberSchema,
  medical_condition: nullableProfileTextSchema,
  injuries: nullableProfileTextSchema,
  medications: nullableProfileTextSchema,
}).min(1);

module.exports = { registerSchema, loginSchema, refreshSchema, updateMeSchema };

