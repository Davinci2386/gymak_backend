const express = require('express');
const { errorHandler, notFound } = require('./middleware');

const userRoutes = require('./modules/user/routes/user.routes');
const trainerRoutes = require('./modules/trainer/routes/trainer.routes');
const adminRoutes = require('./modules/admin/routes/admin.routes');
const subscriptionRoutes = require('./modules/subscription/routes/subscription.routes');
const workoutRoutes = require('./modules/workout/routes/workout.routes');
const nutritionRoutes = require('./modules/nutrition/routes/nutrition.routes');
const chatRoutes = require('./modules/chat/routes/chat.routes');
const paymentRoutes = require('./modules/payment/routes/payment.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');
const locationRoutes = require('./modules/location/routes/location.routes');
const songRoutes = require('./modules/song/routes/song.routes');

const app = express();

// ⚠️ CRITICAL: Webhook must receive raw body for signature verification
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  express.json()(req, res, next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/user', userRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/songs', songRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
