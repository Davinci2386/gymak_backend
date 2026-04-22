const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env } = require('../../../config');
const { AppError, UnauthorizedError } = require('../../../shared/errors');
const adminRepo = require('../repository/admin.repository');
const sessionRepo = require('../repository/session.repository');

/**
 * Sign JWT access token for admin
 */
function signAccessToken({ adminId, role }) {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT is not configured (missing JWT_SECRET)', 500);
  }

  return jwt.sign(
    { role },
    env.JWT_SECRET,
    {
      subject: adminId,
      expiresIn: env.JWT_EXPIRES_IN || '1h',
    },
  );
}

/**
 * Generate random refresh token
 */
function createRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Hash refresh token for storage
 */
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate refresh token expiry (30 days from now)
 */
function refreshTokenExpiresAt(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Issue both access and refresh tokens for admin
 */
async function issueTokens(admin) {
  const accessToken = signAccessToken({ adminId: admin.id, role: admin.role });

  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await sessionRepo.createSession({
    userId: admin.id,
    refreshTokenHash,
    expiresAt: refreshTokenExpiresAt(30),
  });

  return { accessToken, refreshToken };
}

/**
 * Admin login
 */
async function login({ email, password }) {
  const admin = await adminRepo.findAdminByEmailWithPassword(email.toLowerCase());
  
  if (!admin || admin.role !== 'ADMIN') {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokens(admin);
  
  // Return admin without password hash
  const { passwordHash, ...adminData } = admin;
  return { admin: adminData, accessToken, refreshToken };
}

/**
 * Register new admin (by existing admin only - handled in controller)
 */
async function register({ firstName, lastName, email, password }) {
  const existing = await adminRepo.findAdminByEmail(email.toLowerCase());
  if (existing) {
    throw new AppError('Admin with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await adminRepo.createAdmin({
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
  });

  return admin;
}

/**
 * Change admin password
 */
async function changePassword({ adminId, currentPassword, newPassword }) {
  const admin = await adminRepo.findAdminByEmailWithPassword(
    (await adminRepo.findAdminById(adminId)).email
  );

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const passwordMatches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  const updated = await adminRepo.updateAdminPassword(adminId, newPasswordHash);

  return updated;
}

/**
 * Refresh admin token
 */
async function refresh({ refreshToken }) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const session = await sessionRepo.findActiveSessionByHash(refreshTokenHash);

  if (!session) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const admin = await adminRepo.findAdminById(session.userId);
  if (!admin || admin.role !== 'ADMIN') {
    throw new UnauthorizedError('Invalid session');
  }

  // Revoke old session and create new one
  await sessionRepo.revokeSessionByHash(refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(admin);

  return { admin, accessToken, refreshToken: newRefreshToken };
}

/**
 * Logout admin
 */
async function logout({ refreshToken }) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await sessionRepo.revokeSessionByHash(refreshTokenHash);
  return { success: true };
}

/**
 * Get admin profile
 */
async function getProfile(adminId) {
  const admin = await adminRepo.findAdminById(adminId);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  return admin;
}

/**
 * Update admin profile
 */
async function updateProfile(adminId, updateData) {
  const admin = await adminRepo.updateAdminProfile(adminId, updateData);
  return admin;
}

module.exports = {
  login,
  register,
  changePassword,
  refresh,
  logout,
  getProfile,
  updateProfile,
};
