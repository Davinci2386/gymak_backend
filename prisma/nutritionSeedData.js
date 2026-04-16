/** Sample meals for `npx prisma db seed` — breakfast, lunch, dinner with ingredients. */
module.exports = [
  {
    section: 'BREAKFAST',
    name: 'Greek yogurt bowl',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    calories: 320,
    ingredients: [
      { name: 'Greek yogurt', quantity: '200g', calories: 130, sortOrder: 0 },
      { name: 'Mixed berries', quantity: '80g', calories: 45, sortOrder: 1 },
      { name: 'Honey', quantity: '1 tbsp', calories: 65, sortOrder: 2 },
      { name: 'Granola', quantity: '30g', calories: 80, sortOrder: 3 },
    ],
  },
  {
    section: 'BREAKFAST',
    name: 'Avocado toast & eggs',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    calories: 410,
    ingredients: [
      { name: 'Whole grain bread', quantity: '2 slices', calories: 160, sortOrder: 0 },
      { name: 'Avocado', quantity: '1/2 medium', calories: 120, sortOrder: 1 },
      { name: 'Eggs', quantity: '2 large', calories: 140, sortOrder: 2 },
      { name: 'Cherry tomatoes', quantity: '50g', calories: 15, sortOrder: 3 },
    ],
  },
  {
    section: 'LUNCH',
    name: 'Grilled chicken salad',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    calories: 480,
    ingredients: [
      { name: 'Chicken breast', quantity: '150g', calories: 230, sortOrder: 0 },
      { name: 'Mixed greens', quantity: '100g', calories: 25, sortOrder: 1 },
      { name: 'Olive oil', quantity: '1 tbsp', calories: 120, sortOrder: 2 },
      { name: 'Feta cheese', quantity: '40g', calories: 105, sortOrder: 3 },
    ],
  },
  {
    section: 'LUNCH',
    name: 'Quinoa veggie bowl',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    calories: 520,
    ingredients: [
      { name: 'Cooked quinoa', quantity: '180g', calories: 220, sortOrder: 0 },
      { name: 'Chickpeas', quantity: '80g', calories: 130, sortOrder: 1 },
      { name: 'Roasted vegetables', quantity: '120g', calories: 90, sortOrder: 2 },
      { name: 'Tahini dressing', quantity: '2 tbsp', calories: 80, sortOrder: 3 },
    ],
  },
  {
    section: 'DINNER',
    name: 'Baked salmon with rice',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
    calories: 590,
    ingredients: [
      { name: 'Salmon fillet', quantity: '180g', calories: 360, sortOrder: 0 },
      { name: 'Brown rice', quantity: '150g cooked', calories: 170, sortOrder: 1 },
      { name: 'Steamed broccoli', quantity: '100g', calories: 35, sortOrder: 2 },
      { name: 'Lemon', quantity: '1/2', calories: 10, sortOrder: 3 },
    ],
  },
  {
    section: 'DINNER',
    name: 'Turkey stir-fry',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f11?w=800',
    calories: 455,
    ingredients: [
      { name: 'Lean turkey', quantity: '150g', calories: 250, sortOrder: 0 },
      { name: 'Bell peppers & onion', quantity: '150g', calories: 45, sortOrder: 1 },
      { name: 'Soy sauce & garlic', quantity: '2 tbsp', calories: 30, sortOrder: 2 },
      { name: 'Jasmine rice', quantity: '120g cooked', calories: 130, sortOrder: 3 },
    ],
  },
];
