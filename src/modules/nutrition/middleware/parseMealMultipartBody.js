const { ValidationError } = require('../../../shared/errors');

function parseMealMultipartBody(req, _res, next) {
  if (typeof req.body?.ingredients !== 'string') {
    return next();
  }

  try {
    const parsed = JSON.parse(req.body.ingredients);
    if (!Array.isArray(parsed)) {
      return next(
        new ValidationError([
          {
            field: 'ingredients',
            message: '"ingredients" must be a JSON array',
          },
        ]),
      );
    }

    req.body.ingredients = parsed;
    return next();
  } catch (_err) {
    return next(
      new ValidationError([
        {
          field: 'ingredients',
          message: '"ingredients" must be a valid JSON array',
        },
      ]),
    );
  }
}

module.exports = parseMealMultipartBody;
