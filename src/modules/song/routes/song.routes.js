const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const songController = require('../controller/song.controller');
const { createSongSchema, updateSongSchema } = require('../validators/song.schemas');

const router = Router();

router.get('/', auth, authorize('USER'), songController.listSongs);
router.get('/:songId', auth, authorize('USER'), songController.getSong);

const admin = [auth, authorize('ADMIN')];

router.post('/', admin, validate(createSongSchema), songController.createSong);
router.put('/:songId', admin, validate(updateSongSchema), songController.updateSong);
router.delete('/:songId', admin, songController.deleteSong);

module.exports = router;
