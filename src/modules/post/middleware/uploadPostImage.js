const createImageUpload = require('../../../middleware/createImageUpload');

module.exports = createImageUpload({ maxFiles: 1 });
