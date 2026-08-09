const mediaUploadService = require('../../../shared/services/mediaUpload.service');

async function uploadProfileImage({ userId, file }) {
  return mediaUploadService.uploadImage({
    file,
    folder: '/users/profile-images',
    tags: [`user:${userId}`],
  });
}

async function deleteProfileImageByFileId(fileId) {
  await mediaUploadService.deleteFileByFileId(fileId);
}

module.exports = {
  uploadProfileImage,
  deleteProfileImageByFileId,
};
