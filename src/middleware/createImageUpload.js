const multer = require('multer');
const { AppError } = require('../shared/errors');

function createImageUpload({ maxFiles = 1, maxFileSizeMb = 10 } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter(_req, file, cb) {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new AppError('Only image files are allowed', 400));
      }
      return cb(null, true);
    },
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
      files: maxFiles,
    },
  });
}

module.exports = createImageUpload;
