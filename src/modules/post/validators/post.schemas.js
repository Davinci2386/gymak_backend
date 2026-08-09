const Joi = require('joi');

const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
});

const updatePostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).optional(),
});

const rejectPostSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(1).max(1000).required(),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  rejectPostSchema,
};
