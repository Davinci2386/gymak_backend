const { prisma } = require('../../../config');

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

function createUser(data) {
  return prisma.user.create({ data });
}

module.exports = {
  findByEmail,
  findById,
  createUser,
};

