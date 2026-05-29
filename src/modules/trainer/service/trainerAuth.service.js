const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env, prisma } = require('../../../config');
const { AppError, UnauthorizedError } = require('../../../shared/errors');

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
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt: refreshTokenExpiresAt(30),
    },
  });

  return { accessToken, refreshToken };
}

async function registerTrainer({ firstName, lastName, email, password, gender, description, birthDate, certificates }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'TRAINER',
      gender,
      birthDate: new Date(birthDate),
      trainerProfile: {
        create: {
          description: description || null,
          certificates: certificates?.length
            ? {
              create: certificates.map((f) => ({
                fileName: f.originalname,
                mimeType: f.mimetype,
                path: f.path.replace(/\\\\/g, '/'),
              })),
            }
            : undefined,
        },
      },
    },
    include: {
      trainerProfile: { include: { certificates: true } },
    },
  });

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user, accessToken, refreshToken };
}

async function loginTrainer({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      trainerProfile: { include: { certificates: true } },
    },
  });

  if (!user || user.role !== 'TRAINER') {
    throw new UnauthorizedError('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user, accessToken, refreshToken };
}

module.exports = { registerTrainer, loginTrainer };
