const { ApiResponse } = require('../../../utils');
const trainerService = require('../service/trainer.service');

async function list(req, res, next) {
  try {
    const trainers = await trainerService.getAllTrainers();
    return ApiResponse.success(res, {
      data: { trainers },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };

