const { ApiResponse } = require('../../../utils');
const songService = require('../service/song.service');

async function listSongs(req, res, next) {
  try {
    const songs = await songService.listSongs();
    return ApiResponse.success(res, {
      message: 'Songs list',
      data: { songs },
    });
  } catch (err) {
    return next(err);
  }
}

async function getSong(req, res, next) {
  try {
    const song = await songService.getSong(req.params.songId);
    return ApiResponse.success(res, {
      message: 'Song details',
      data: { song },
    });
  } catch (err) {
    return next(err);
  }
}

async function createSong(req, res, next) {
  try {
    const song = await songService.createSong({
      adminId: req.user.id,
      payload: req.body,
    });

    return ApiResponse.created(res, {
      message: 'Song created',
      data: { song },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateSong(req, res, next) {
  try {
    const song = await songService.updateSong({
      songId: req.params.songId,
      payload: req.body,
    });

    return ApiResponse.success(res, {
      message: 'Song updated',
      data: { song },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteSong(req, res, next) {
  try {
    await songService.deleteSong(req.params.songId);
    return ApiResponse.success(res, {
      message: 'Song deleted',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
};
