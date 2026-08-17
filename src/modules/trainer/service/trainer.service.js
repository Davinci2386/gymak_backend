const trainerRepo = require('../repository/trainer.repository');
const { AppError } = require('../../../shared/errors');

function computeAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

async function getAllTrainers() {
  return trainerRepo.listTrainers();
}

async function getTrainerById(trainerId) {
  const trainer = await trainerRepo.findTrainerById(trainerId);

  if (!trainer) {
    throw new AppError('Trainer not found', 404);
  }

  return {
    id: trainer.id,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
    gender: trainer.gender,
    birthDate: trainer.birthDate,
    age: computeAge(trainer.birthDate),
    role: trainer.role,

    profileImageUrls: trainer.profileImages.map((image) => image.url),

    trainerProfile: trainer.trainerProfile
      ? {
          id: trainer.trainerProfile.id,
          description: trainer.trainerProfile.description,
          certificates: trainer.trainerProfile.certificates || [],
          createdAt: trainer.trainerProfile.createdAt,
          updatedAt: trainer.trainerProfile.updatedAt,
        }
      : null,

    createdAt: trainer.createdAt,
    updatedAt: trainer.updatedAt,
  };
}

module.exports = {
  getAllTrainers,
  getTrainerById,
};