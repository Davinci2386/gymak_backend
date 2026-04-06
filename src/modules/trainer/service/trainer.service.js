const trainerRepo = require('../repository/trainer.repository');

async function getAllTrainers() {
  return trainerRepo.listTrainers();
}

module.exports = { getAllTrainers };

