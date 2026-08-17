const Joi = require('joi');

const sendChatMessageSchema = Joi.object({
  playerId: Joi.string().uuid().optional(),
  text: Joi.string().trim().min(1).max(2000).required(),
  clientMessageId: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9_-]{10,128}$/)
    .optional(),
});

module.exports = { sendChatMessageSchema };
