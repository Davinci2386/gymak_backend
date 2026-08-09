const { AppError } = require('../../../shared/errors');
const mediaUploadService = require('../../../shared/services/mediaUpload.service');
const postRepo = require('../repository/post.repository');
const { paginate, buildPaginationMeta, formatFriendlyDate } = require('../../../utils');

const POST_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);

function mapAuthor(trainer) {
  if (!trainer) return null;

  return {
    id: trainer.id,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
    role: trainer.role,
    profileImageUrl: trainer.profileImages?.[0]?.url || null,
  };
}

function mapReviewer(reviewer) {
  if (!reviewer) return null;

  return {
    id: reviewer.id,
    firstName: reviewer.firstName,
    lastName: reviewer.lastName,
    email: reviewer.email,
    role: reviewer.role,
  };
}

function mapPost(post) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    status: post.status,
    rejectionReason: post.rejectionReason,
    createdAt: post.createdAt,
    formattedCreatedAt: formatFriendlyDate(post.createdAt),
    updatedAt: post.updatedAt,
    reviewedAt: post.reviewedAt,
    formattedReviewedAt: formatFriendlyDate(post.reviewedAt),
    trainer: mapAuthor(post.trainer),
    reviewedByAdmin: mapReviewer(post.reviewedByAdmin),
  };
}

function parseStatusFilter(status) {
  if (!status) return null;
  if (!POST_STATUSES.has(status)) {
    throw new AppError('Invalid status filter', 400);
  }
  return status;
}

async function uploadPostImage({ trainerId, file }) {
  if (!file) return null;

  return mediaUploadService.uploadImage({
    file,
    folder: '/posts',
    tags: [`trainer:${trainerId}`],
  });
}

async function listPublicPosts({ page, limit }) {
  const paginationInput = paginate({ page, limit });
  const [posts, totalItems] = await Promise.all([
    postRepo.listApprovedPosts({ skip: paginationInput.skip, take: paginationInput.perPage }),
    postRepo.countApprovedPosts(),
  ]);

  return {
    posts: posts.map(mapPost),
    pagination: buildPaginationMeta({
      currentPage: paginationInput.currentPage,
      perPage: paginationInput.perPage,
      totalItems,
    }),
  };
}

async function getPublicPost(postId) {
  const post = await postRepo.findApprovedPostById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  return mapPost(post);
}

async function createPost({ trainerId, content, imageFile }) {
  let uploadedImage = null;

  try {
    uploadedImage = await uploadPostImage({ trainerId, file: imageFile });

    const post = await postRepo.createPost({
      trainerId,
      content,
      imageUrl: uploadedImage?.url || null,
      imageFileId: uploadedImage?.fileId || null,
    });

    return mapPost(post);
  } catch (error) {
    await mediaUploadService.deleteFileByFileId(uploadedImage?.fileId);
    throw error;
  }
}

async function listTrainerPosts({ trainerId, page, limit }) {
  const paginationInput = paginate({ page, limit });
  const [posts, totalItems] = await Promise.all([
    postRepo.listTrainerPosts({
      trainerId,
      skip: paginationInput.skip,
      take: paginationInput.perPage,
    }),
    postRepo.countTrainerPosts(trainerId),
  ]);

  return {
    posts: posts.map(mapPost),
    pagination: buildPaginationMeta({
      currentPage: paginationInput.currentPage,
      perPage: paginationInput.perPage,
      totalItems,
    }),
  };
}

async function updatePost({ trainerId, postId, content, imageFile }) {
  const existingPost = await postRepo.findPostById(postId);
  if (!existingPost) {
    throw new AppError('Post not found', 404);
  }
  if (existingPost.trainerId !== trainerId) {
    throw new AppError('Forbidden', 403);
  }

  if (content === undefined && !imageFile) {
    throw new AppError('No fields to update', 400);
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadPostImage({ trainerId, file: imageFile });

    const data = {
      ...(content !== undefined ? { content } : {}),
      ...(uploadedImage
        ? {
            imageUrl: uploadedImage.url,
            imageFileId: uploadedImage.fileId,
          }
        : {}),
      status: 'PENDING',
      reviewedByAdminId: null,
      reviewedAt: null,
      rejectionReason: null,
    };

    const updatedPost = await postRepo.updatePost(postId, data);

    if (uploadedImage && existingPost.imageFileId) {
      await mediaUploadService.deleteFileByFileId(existingPost.imageFileId);
    }

    return mapPost(updatedPost);
  } catch (error) {
    await mediaUploadService.deleteFileByFileId(uploadedImage?.fileId);
    throw error;
  }
}

async function deletePost({ trainerId, postId }) {
  const existingPost = await postRepo.findPostById(postId);
  if (!existingPost) {
    throw new AppError('Post not found', 404);
  }
  if (existingPost.trainerId !== trainerId) {
    throw new AppError('Forbidden', 403);
  }

  await postRepo.deletePost(postId);
  await mediaUploadService.deleteFileByFileId(existingPost.imageFileId);
}

async function listAdminPosts({ status, page, limit }) {
  const parsedStatus = parseStatusFilter(status);
  const paginationInput = paginate({ page, limit });
  const [posts, totalItems] = await Promise.all([
    postRepo.listAdminPosts({
      status: parsedStatus,
      skip: paginationInput.skip,
      take: paginationInput.perPage,
    }),
    postRepo.countAdminPosts(parsedStatus),
  ]);

  return {
    posts: posts.map(mapPost),
    pagination: buildPaginationMeta({
      currentPage: paginationInput.currentPage,
      perPage: paginationInput.perPage,
      totalItems,
    }),
  };
}

async function getAdminPost(postId) {
  const post = await postRepo.findPostById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  return mapPost(post);
}

async function approvePost({ postId, adminId }) {
  const existingPost = await postRepo.findPostById(postId);
  if (!existingPost) {
    throw new AppError('Post not found', 404);
  }

  const post = await postRepo.updatePost(postId, {
    status: 'APPROVED',
    reviewedByAdminId: adminId,
    reviewedAt: new Date(),
    rejectionReason: null,
  });

  return mapPost(post);
}

async function rejectPost({ postId, adminId, rejectionReason }) {
  const existingPost = await postRepo.findPostById(postId);
  if (!existingPost) {
    throw new AppError('Post not found', 404);
  }

  const post = await postRepo.updatePost(postId, {
    status: 'REJECTED',
    reviewedByAdminId: adminId,
    reviewedAt: new Date(),
    rejectionReason,
  });

  return mapPost(post);
}

module.exports = {
  listPublicPosts,
  getPublicPost,
  createPost,
  listTrainerPosts,
  updatePost,
  deletePost,
  listAdminPosts,
  getAdminPost,
  approvePost,
  rejectPost,
};
