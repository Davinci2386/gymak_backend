const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env } = require('../../../config');
const { AppError, UnauthorizedError } = require('../../../shared/errors');
const userRepo = require('../repository/user.repository');
const sessionRepo = require('../repository/session.repository');

function signAccessToken({ userId, role }) {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT is not configured (missing JWT_SECRET)', 500);
  }

  return jwt.sign(
    { role },
    env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN || '1h',
    },
  );
}

function createRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiresAt(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function issueTokens(user) {
  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await sessionRepo.createSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt: refreshTokenExpiresAt(30),
  });

  return { accessToken, refreshToken };
}

async function register(payload) {
  const existing = await userRepo.findByEmail(payload.email);
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await userRepo.createUser({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    passwordHash,
    gender: payload.gender,
    birthDate: new Date(payload.birthDate),
    role: 'USER',
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user, accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const session = await sessionRepo.findActiveSessionByHash(refreshTokenHash);
  if (!session) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await userRepo.findById(session.userId);
  if (!user) {
    throw new UnauthorizedError('Invalid session');
  }

  await sessionRepo.revokeSessionByHash(refreshTokenHash);
  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

  return { user, accessToken, refreshToken: newRefreshToken };
}

async function logout({ refreshToken }) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await sessionRepo.revokeSessionByHash(refreshTokenHash);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};

