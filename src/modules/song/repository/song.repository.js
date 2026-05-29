const { prisma } = require('../../../config');

function findAllSongs() {
  return prisma.song.findMany({
    orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
  });
}

function findSongById(id) {
  return prisma.song.findUnique({
    where: { id },
  });
}

function createSong({ title, artist, coverImageUrl, mp3Url, durationSeconds, createdByAdminId }) {
  return prisma.song.create({
    data: {
      title,
      artist,
      coverImageUrl,
      mp3Url,
      durationSeconds,
      createdByAdminId,
    },
  });
}

function updateSong(id, payload) {
  return prisma.song.update({
    where: { id },
    data: payload,
  });
}

function deleteSong(id) {
  return prisma.song.delete({
    where: { id },
  });
}

module.exports = {
  findAllSongs,
  findSongById,
  createSong,
  updateSong,
  deleteSong,
};
