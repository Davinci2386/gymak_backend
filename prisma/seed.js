/* eslint-disable no-console */
const { PrismaClient } = require('../src/generated/prisma');
const nutritionSeedData = require('./nutritionSeedData');

const prisma = new PrismaClient();

const seedDays = [
  {
    dayNumber: 1,
    label: 'Day 1 — Full body',
    exercises: [
      {
        name: 'Bodyweight squat',
        description:
          'Feet shoulder-width, chest up, squat until thighs are parallel to the floor, then stand.',
        imageUrls: [
          'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        ],
        videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
        sortOrder: 0,
      },
      {
        name: 'Push-up',
        description: 'Plank position, lower chest to floor, press back up keeping core tight.',
        imageUrls: ['https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800'],
        videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
        sortOrder: 1,
      },
    ],
  },
  {
    dayNumber: 2,
    label: 'Day 2 — Cardio & core',
    exercises: [
      {
        name: 'Jumping jacks',
        description: 'Jump feet out while raising arms overhead, then return to start.',
        imageUrls: [],
        videoUrl: 'https://www.youtube.com/watch?v=iSSAk4XCsRA',
        sortOrder: 0,
      },
      {
        name: 'Plank',
        description: 'Forearms on floor, body straight from head to heels, hold.',
        imageUrls: ['https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800'],
        videoUrl: null,
        sortOrder: 1,
      },
    ],
  },
  {
    dayNumber: 3,
    label: 'Day 3 — Active recovery',
    exercises: [
      {
        name: 'Walking',
        description: 'Brisk 20–30 minute walk; keep posture tall.',
        imageUrls: [],
        videoUrl: null,
        sortOrder: 0,
      },
    ],
  },
];

async function seedWorkoutDefaultPlan() {
  const plan = await prisma.workoutPlan.upsert({
    where: { slug: 'default' },
    create: {
      slug: 'default',
      title: '7-day starter plan',
    },
    update: {
      title: '7-day starter plan',
    },
  });

  const dayCount = await prisma.workoutDay.count({ where: { planId: plan.id } });
  if (dayCount > 0) {
    console.log('Workout plan already has days; skip workout seed.');
    return;
  }

  for (const d of seedDays) {
    const day = await prisma.workoutDay.create({
      data: {
        planId: plan.id,
        dayNumber: d.dayNumber,
        label: d.label,
        exercises: {
          create: d.exercises.map((e) => ({
            name: e.name,
            description: e.description,
            imageUrls: e.imageUrls,
            videoUrl: e.videoUrl,
            sortOrder: e.sortOrder,
          })),
        },
      },
    });
    console.log(`Seeded workout day ${day.dayNumber}`);
  }
}

async function seedNutritionMeals() {
  const mealCount = await prisma.nutritionMeal.count();
  if (mealCount > 0) {
    console.log('Nutrition meals already present; skip nutrition seed.');
    return;
  }

  for (const m of nutritionSeedData) {
    await prisma.nutritionMeal.create({
      data: {
        section: m.section,
        name: m.name,
        imageUrl: m.imageUrl,
        calories: m.calories,
        ingredients: {
          create: m.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            calories: ing.calories,
            sortOrder: ing.sortOrder,
          })),
        },
      },
    });
    console.log(`Seeded nutrition meal: ${m.name} (${m.section})`);
  }
}

async function main() {
  await seedWorkoutDefaultPlan();
  await seedNutritionMeals();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
