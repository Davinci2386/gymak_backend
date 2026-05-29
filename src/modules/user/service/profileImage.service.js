const ImageKit = require('imagekit');
const { env } = require('../../../config');
const { AppError } = require('../../../shared/errors');

let imagekitClient;

function getImagekitClient() {
  if (imagekitClient) {
    return imagekitClient;
  }

  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    throw new AppError('ImageKit is not configured', 500);
  }

  imagekitClient = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });

  return imagekitClient;
}

async function uploadProfileImage({ userId, file }) {
  const client = getImagekitClient();
  const uploadResult = await client.upload({
    file: file.buffer,
    fileName: `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    folder: '/users/profile-images',
    useUniqueFileName: true,
    tags: [`user:${userId}`],
  });

  return {
    url: uploadResult.url,
    fileId: uploadResult.fileId,
  };
}

async function deleteProfileImageByFileId(fileId) {
  const client = getImagekitClient();
  try {
    await client.deleteFile(fileId);
  } catch (_err) {
    // Ignore remote delete failures so user can still update DB state.
  }
}

module.exports = {
  uploadProfileImage,
  deleteProfileImageByFileId,
};
