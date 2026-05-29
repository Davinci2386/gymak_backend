const multer = require('multer');
const { AppError } = require('../../../shared/errors');

const uploadProfileImages = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed', 400));
    }
    return cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

module.exports = uploadProfileImages;
