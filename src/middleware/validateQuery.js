const { ValidationError } = require('../shared/errors');

function validateQuery(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.query, {
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

    req.validatedQuery = value;
    return next();
  };
}

module.exports = validateQuery;
