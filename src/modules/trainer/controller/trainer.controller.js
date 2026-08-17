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

async function getById(req, res, next) {
  try {
    const trainer = await trainerService.getTrainerById(
      req.params.trainerId
    );

    return ApiResponse.success(res, {
      message: 'Trainer details',
      data: { trainer },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  list,
  getById,
};