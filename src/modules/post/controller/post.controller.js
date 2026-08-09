const { ApiResponse } = require('../../../utils');
const postService = require('../service/post.service');

async function listPublicPosts(req, res, next) {
  try {
    const result = await postService.listPublicPosts({
      page: req.query.page,
      limit: req.query.limit,
    });

    return ApiResponse.success(res, {
      message: 'Posts list',
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function getPublicPost(req, res, next) {
  try {
    const post = await postService.getPublicPost(req.params.postId);
    return ApiResponse.success(res, {
      message: 'Post details',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const post = await postService.createPost({
      trainerId: req.user.id,
      content: req.body.content,
      imageFile: req.file || null,
    });

    return ApiResponse.created(res, {
      message: 'Post created successfully and is pending review',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyPosts(req, res, next) {
  try {
    const result = await postService.listTrainerPosts({
      trainerId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ApiResponse.success(res, {
      message: 'My posts',
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await postService.updatePost({
      trainerId: req.user.id,
      postId: req.params.postId,
      content: req.body.content,
      imageFile: req.file || null,
    });

    return ApiResponse.success(res, {
      message: 'Post updated and sent for review',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    await postService.deletePost({
      trainerId: req.user.id,
      postId: req.params.postId,
    });

    return ApiResponse.success(res, {
      message: 'Post deleted',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function listAdminPosts(req, res, next) {
  try {
    const result = await postService.listAdminPosts({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ApiResponse.success(res, {
      message: 'Posts list',
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function getAdminPost(req, res, next) {
  try {
    const post = await postService.getAdminPost(req.params.postId);
    return ApiResponse.success(res, {
      message: 'Post details',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

async function approvePost(req, res, next) {
  try {
    const post = await postService.approvePost({
      postId: req.params.postId,
      adminId: req.user.id,
    });

    return ApiResponse.success(res, {
      message: 'Post approved',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

async function rejectPost(req, res, next) {
  try {
    const post = await postService.rejectPost({
      postId: req.params.postId,
      adminId: req.user.id,
      rejectionReason: req.body.rejectionReason,
    });

    return ApiResponse.success(res, {
      message: 'Post rejected',
      data: { post },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPublicPosts,
  getPublicPost,
  createPost,
  listMyPosts,
  updatePost,
  deletePost,
  listAdminPosts,
  getAdminPost,
  approvePost,
  rejectPost,
};
