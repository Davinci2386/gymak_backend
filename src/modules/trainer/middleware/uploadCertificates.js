const multer = require('multer');

const upload = multer({
  // Temporary backwards compatibility for clients that still send files.
  // Files are kept in memory only; the API stores their names as strings.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

module.exports = upload;
