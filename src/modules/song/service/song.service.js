const { AppError } = require('../../../shared/errors');
const songRepo = require('../repository/song.repository');

let musicMetadataModulePromise;

async function getParseWebStream() {
  if (!musicMetadataModulePromise) {
    musicMetadataModulePromise = import('music-metadata');
  }
  const module = await musicMetadataModulePromise;
  return module.parseWebStream;
}

function mapSong(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    coverImageUrl: song.coverImageUrl,
    mp3Url: song.mp3Url,
    durationSeconds: song.durationSeconds,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  };
}

async function resolveDurationSeconds(mp3Url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const parseWebStream = await getParseWebStream();
    const response = await fetch(mp3Url, { signal: controller.signal });
    if (!response.ok || !response.body) {
      return 0;
    }

    const contentType = response.headers.get('content-type') || undefined;
    const contentLengthHeader = response.headers.get('content-length');
    const size = contentLengthHeader ? Number(contentLengthHeader) : undefined;

    const metadata = await parseWebStream(
      response.body,
      {
        mimeType: contentType,
        size: Number.isFinite(size) ? size : undefined,
      },
      { duration: true },
    );

    const duration = metadata?.format?.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      return 0;
    }

    return Math.round(duration);
  } catch (_err) {
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

async function listSongs() {
  const songs = await songRepo.findAllSongs();
  return songs.map(mapSong);
}

async function getSong(songId) {
  const song = await songRepo.findSongById(songId);
  if (!song) {
    throw new AppError('Song not found', 404);
  }
  return mapSong(song);
}

async function createSong({ adminId, payload }) {
  const durationSeconds = await resolveDurationSeconds(payload.mp3Url);

  const song = await songRepo.createSong({
    title: payload.title,
    artist: payload.artist,
    coverImageUrl: payload.coverImageUrl,
    mp3Url: payload.mp3Url,
    durationSeconds,
    createdByAdminId: adminId,
  });

  return mapSong(song);
}

async function updateSong({ songId, payload }) {
  const existingSong = await songRepo.findSongById(songId);
  if (!existingSong) {
    throw new AppError('Song not found', 404);
  }

  const data = {};
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.artist !== undefined) data.artist = payload.artist;
  if (payload.coverImageUrl !== undefined) data.coverImageUrl = payload.coverImageUrl;
  if (payload.mp3Url !== undefined) {
    data.mp3Url = payload.mp3Url;
    if (payload.durationSeconds === undefined) {
      data.durationSeconds = await resolveDurationSeconds(payload.mp3Url);
    }
  }
  if (payload.durationSeconds !== undefined) data.durationSeconds = payload.durationSeconds;

  if (Object.keys(data).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  const song = await songRepo.updateSong(songId, data);
  return mapSong(song);
}

async function deleteSong(songId) {
  const existingSong = await songRepo.findSongById(songId);
  if (!existingSong) {
    throw new AppError('Song not found', 404);
  }

  await songRepo.deleteSong(songId);
}

module.exports = {
  listSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
};
