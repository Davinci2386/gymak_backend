const { Router } = require('express');
const { auth, authorize, validate } = require('../../../middleware');
const { createRequestSchema } = require('../validators/trainerRequest.schemas');
const trainerRequestController = require('../controller/trainerRequest.controller');

const router = Router();

// Player → request a trainer
router.post('/trainer-requests', auth, authorize('USER'), validate(createRequestSchema), trainerRequestController.create);
router.get('/trainer-requests/me', auth, authorize('USER'), trainerRequestController.myRequests);
router.post('/trainer-requests/:requestId/cancel', auth, authorize('USER'), trainerRequestController.cancel);

// Trainer → inbox + approve/reject
router.get('/trainer-requests/inbox', auth, authorize('TRAINER'), trainerRequestController.inbox);
router.post('/trainer-requests/:requestId/approve', auth, authorize('TRAINER'), trainerRequestController.approve);
router.post('/trainer-requests/:requestId/reject', auth, authorize('TRAINER'), trainerRequestController.reject);

// Player → current assignment
router.get('/assignment/me', auth, authorize('USER'), trainerRequestController.myAssignment);

module.exports = router;
