const Joi = require('joi');

const ingredientSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  quantity: Joi.string().trim().min(1).required(),
  calories: Joi.number().integer().min(0).required(),
  sortOrder: Joi.number().integer().min(0),
});

const createMealSchema = Joi.object({
  section: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER').required(),
  name: Joi.string().trim().min(1).required(),
  calories: Joi.number().integer().min(0).required(),
  ingredients: Joi.array().items(ingredientSchema).min(1).required(),
});

const createCatalogMealSchema = createMealSchema;

const updateMealSchema = Joi.object({
  section: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER'),
  name: Joi.string().trim().min(1),
  imageUrl: Joi.string().trim().uri(),
  calories: Joi.number().integer().min(0),
  ingredients: Joi.array().items(ingredientSchema).min(1),
}).min(1);

const addMealFromCatalogSchema = Joi.object({
  sourceCatalogMealId: Joi.string().uuid(),
  sourceMealId: Joi.string().uuid(),
}).or('sourceCatalogMealId', 'sourceMealId');

module.exports = {
  createCatalogMealSchema,
  createMealSchema,
  updateMealSchema,
  addMealFromCatalogSchema,
};
