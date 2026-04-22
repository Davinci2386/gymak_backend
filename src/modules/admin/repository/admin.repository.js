const { PrismaClient } = require('../../../generated/prisma');

const prisma = new PrismaClient();

class AdminRepository {
  /**
   * Find admin by email
   */
  async findAdminByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find admin by ID
   */
  async findAdminById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create new admin
   */
  async createAdmin({ firstName, lastName, email, passwordHash }) {
    return prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update admin password
   */
  async updateAdminPassword(adminId, newPasswordHash) {
    return prisma.user.update({
      where: { id: adminId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  /**
   * Update admin profile
   */
  async updateAdminProfile(adminId, updateData) {
    return prisma.user.update({
      where: { id: adminId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get admin with password hash (for authentication)
   */
  async findAdminByEmailWithPassword(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Check if admin exists
   */
  async adminExists(email) {
    const admin = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    return admin && admin.role === 'ADMIN';
  }
}

module.exports = new AdminRepository();
