const Joi = require('joi');

const notificationDataSchema = Joi.object()
  .pattern(Joi.string(), Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()))
  .default({});

const registerDeviceTokenSchema = Joi.object({
  token: Joi.string().trim().min(20).required(),
  platform: Joi.string().valid('ANDROID', 'IOS', 'WEB', 'UNKNOWN').default('UNKNOWN'),
  deviceName: Joi.string().trim().max(255).allow('', null).optional(),
});

const deleteDeviceTokenSchema = Joi.object({
  token: Joi.string().trim().min(20).required(),
});

const sendNotificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  data: notificationDataSchema,
});

const sendBroadcastNotificationSchema = Joi.object({
  audienceRole: Joi.string().valid('USER', 'TRAINER', 'ALL').default('ALL'),
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(1000).required(),
  data: notificationDataSchema,
});

module.exports = {
  registerDeviceTokenSchema,
  deleteDeviceTokenSchema,
  sendNotificationSchema,
  sendBroadcastNotificationSchema,
};
