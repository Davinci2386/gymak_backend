const { ValidationError } = require('../shared/errors');

function validate(schema) {
  return (req, _res, next) => {
    // Support multipart/form-data: multer leaves fields as strings in req.body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ValidationError(errors));
    }

    req.body = value;
    next();
  };
}

module.exports = validate;
