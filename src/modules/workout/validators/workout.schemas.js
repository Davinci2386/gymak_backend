const Joi = require('joi');

const createDaySchema = Joi.object({
  dayNumber: Joi.number().integer().min(1).required(),
  label: Joi.string().allow('', null),
});

const updateDaySchema = Joi.object({
  dayNumber: Joi.number().integer().min(1),
  label: Joi.string().allow('', null),
}).min(1);

const createExerciseSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().allow('', null).default(''),
  imageUrls: Joi.array().items(Joi.string().trim().min(1)).default([]),
  videoUrl: Joi.string().trim().allow('', null),
  sortOrder: Joi.number().integer().min(0),
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().trim().min(1),
  description: Joi.string().allow('', null),
  imageUrls: Joi.array().items(Joi.string().trim().min(1)),
  videoUrl: Joi.string().trim().allow('', null),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

module.exports = {
  createDaySchema,
  updateDaySchema,
  createExerciseSchema,
  updateExerciseSchema,
};
