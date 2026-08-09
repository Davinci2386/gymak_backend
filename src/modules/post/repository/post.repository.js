const { prisma } = require('../../../config');

const trainerInclude = {
  trainer: {
    include: {
      profileImages: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  },
  reviewedByAdmin: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
};

function listApprovedPosts({ skip, take }) {
  return prisma.post.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: trainerInclude,
  });
}

function countApprovedPosts() {
  return prisma.post.count({
    where: { status: 'APPROVED' },
  });
}

function findApprovedPostById(postId) {
  return prisma.post.findFirst({
    where: {
      id: postId,
      status: 'APPROVED',
    },
    include: trainerInclude,
  });
}

function createPost(data) {
  return prisma.post.create({
    data,
    include: trainerInclude,
  });
}

function findPostById(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: trainerInclude,
  });
}

function updatePost(postId, data) {
  return prisma.post.update({
    where: { id: postId },
    data,
    include: trainerInclude,
  });
}

function deletePost(postId) {
  return prisma.post.delete({
    where: { id: postId },
  });
}

function listTrainerPosts({ trainerId, skip, take }) {
  return prisma.post.findMany({
    where: { trainerId },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: trainerInclude,
  });
}

function countTrainerPosts(trainerId) {
  return prisma.post.count({
    where: { trainerId },
  });
}

function listAdminPosts({ status, skip, take }) {
  return prisma.post.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: trainerInclude,
  });
}

function countAdminPosts(status) {
  return prisma.post.count({
    where: status ? { status } : undefined,
  });
}

module.exports = {
  listApprovedPosts,
  countApprovedPosts,
  findApprovedPostById,
  createPost,
  findPostById,
  updatePost,
  deletePost,
  listTrainerPosts,
  countTrainerPosts,
  listAdminPosts,
  countAdminPosts,
};
