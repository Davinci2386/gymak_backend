const Joi = require('joi');

const adminLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
});

const adminRegisterSchema = Joi.object({
  firstName: Joi.string()
    .required()
    .messages({
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .required()
    .messages({
      'any.required': 'Last name is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required',
      'any.invalid': 'New password must be different from current password',
    }),
});

const updateAdminProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().min(20).required(),
});

module.exports = {
  adminLoginSchema,
  adminRegisterSchema,
  changePasswordSchema,
  updateAdminProfileSchema,
  refreshTokenSchema,
};
