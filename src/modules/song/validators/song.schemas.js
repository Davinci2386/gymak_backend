const Joi = require('joi');

const createSongSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  artist: Joi.string().trim().min(1).required(),
  coverImageUrl: Joi.string().trim().uri().required(),
  mp3Url: Joi.string().trim().uri().required(),
});

const updateSongSchema = Joi.object({
  title: Joi.string().trim().min(1),
  artist: Joi.string().trim().min(1),
  coverImageUrl: Joi.string().trim().uri(),
  mp3Url: Joi.string().trim().uri(),
  durationSeconds: Joi.number().integer().min(1),
}).min(1);

module.exports = {
  createSongSchema,
  updateSongSchema,
};
