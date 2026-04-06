const { UnauthorizedError } = require('../shared/errors');
const jwt = require('jsonwebtoken');
const { env } = require('../config');

function auth(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : null;

  if (!token) {
    return next(new UnauthorizedError('Authentication token is required'));
  }

  if (!env.JWT_SECRET) {
    return next(new UnauthorizedError('JWT is not configured (missing JWT_SECRET)'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (_err) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedError('You do not have permission to access this resource'));
    }
    next();
  };
}

module.exports = { auth, authorize };
