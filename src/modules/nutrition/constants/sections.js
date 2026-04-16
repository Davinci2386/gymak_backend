/** Maps API / query strings to Prisma `MealSection` values. */
const SECTION_FROM_QUERY = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
};

const SECTION_TO_API_KEY = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
};

module.exports = {
  SECTION_FROM_QUERY,
  SECTION_TO_API_KEY,
};
