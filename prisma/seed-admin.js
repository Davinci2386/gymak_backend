#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Admin seeding script
 * Creates a default admin account for the application
 *
 * Usage: node prisma/seed-admin.js [email] [password]
 * Default: admin@workout.com / admin123456
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.argv[2] || 'admin@workout.com';
  const password = process.argv[3] || 'admin123456';

  console.log('\n🔐 Creating admin account...');
  console.log(`📧 Email: ${email}`);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin && existingAdmin.role === 'ADMIN') {
    console.log('✅ Admin already exists with this email');
    await prisma.$disconnect();
    return;
  }

  if (existingAdmin) {
    console.log('❌ User exists with this email but is not an admin');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        firstName: 'System',
        lastName: 'Admin',
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

    console.log('\n✅ Admin account created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.createdAt.toISOString()}`);

    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password} (Change this immediately!)`);

    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Use these credentials to login at POST /api/admin/auth/login');
    console.log('   - Change password immediately after first login using POST /api/admin/change-password');
    console.log('   - Keep credentials secure - do not share or commit to version control\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

seedAdmin();
