const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const postController = require('../controller/post.controller');
const uploadPostImage = require('../middleware/uploadPostImage');
const { createPostSchema, updatePostSchema } = require('../validators/post.schemas');

const router = Router();

router.get('/', postController.listPublicPosts);
router.get('/mine', auth, authorize('TRAINER'), postController.listMyPosts);
router.get('/:postId', postController.getPublicPost);

const trainer = [auth, authorize('TRAINER')];

router.post('/', trainer, uploadPostImage.single('image'), validate(createPostSchema), postController.createPost);
router.put('/:postId', trainer, uploadPostImage.single('image'), validate(updatePostSchema), postController.updatePost);
router.delete('/:postId', trainer, postController.deletePost);

module.exports = router;
