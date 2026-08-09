const ImageKit = require('imagekit');
const { env } = require('../../config');
const { AppError } = require('../errors');

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

function buildSafeFileName(originalname) {
  return `${Date.now()}_${String(originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

async function uploadImage({ file, folder, tags = [] }) {
  const client = getImagekitClient();
  const uploadResult = await client.upload({
    file: file.buffer,
    fileName: buildSafeFileName(file.originalname),
    folder,
    useUniqueFileName: true,
    tags,
  });

  return {
    url: uploadResult.url,
    fileId: uploadResult.fileId,
  };
}

async function uploadImages({ files, folder, tags = [] }) {
  const uploads = [];
  for (const file of files || []) {
    uploads.push(await uploadImage({ file, folder, tags }));
  }
  return uploads;
}

async function deleteFileByFileId(fileId) {
  if (!fileId) return;
  const client = getImagekitClient();
  try {
    await client.deleteFile(fileId);
  } catch (_err) {
    // Ignore remote delete failures so DB cleanup can continue.
  }
}

async function deleteFilesByFileIds(fileIds) {
  await Promise.all((fileIds || []).map((fileId) => deleteFileByFileId(fileId)));
}

module.exports = {
  uploadImage,
  uploadImages,
  deleteFileByFileId,
  deleteFilesByFileIds,
};
