const admin = require('firebase-admin');
const { prisma } = require('../../../config');
const { AppError } = require('../../../shared/errors');
const firebaseAdminService = require('../../../shared/services/firebaseAdmin.service');

function conversationId(playerId, trainerId) {
  return `player_${playerId}__trainer_${trainerId}`;
}

function fullName(user, fallback) {
  const value = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  return value || fallback;
}

async function activeAssignmentsFor(userId, role) {
  if (role === 'USER') {
    const assignment = await prisma.trainerAssignment.findFirst({
      where: { playerId: userId, status: 'ACTIVE' },
      include: {
        player: { select: { id: true, firstName: true, lastName: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return assignment ? [assignment] : [];
  }

  if (role === 'TRAINER') {
    return prisma.trainerAssignment.findMany({
      where: { trainerId: userId, status: 'ACTIVE' },
      include: {
        player: { select: { id: true, firstName: true, lastName: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  throw new AppError('Only players and trainers can access chat', 403);
}

async function syncConversations({ assignments, userId, role }) {
  const firestore = firebaseAdminService.getFirestore();
  const participantField = role === 'TRAINER' ? 'trainerId' : 'playerId';
  const activeIds = new Set(
    assignments.map((assignment) =>
      conversationId(assignment.playerId, assignment.trainerId)),
  );

  const existing = await firestore
    .collection('conversations')
    .where(participantField, '==', userId)
    .get();
  await Promise.all(
    existing.docs
      .filter((document) => !activeIds.has(document.id))
      .map((document) => document.reference.set({
        assignmentStatus: 'ENDED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })),
  );

  await Promise.all(
    assignments.map(async (assignment) => {
      const id = conversationId(assignment.playerId, assignment.trainerId);
      const reference = firestore.collection('conversations').doc(id);
      const snapshot = await reference.get();
      const data = {
        playerId: assignment.playerId,
        trainerId: assignment.trainerId,
        assignmentId: assignment.id,
        participantIds: [assignment.playerId, assignment.trainerId],
        playerName: fullName(assignment.player, 'Player'),
        trainerName: fullName(assignment.trainer, 'Coach'),
        assignmentStatus: 'ACTIVE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!snapshot.exists) {
        data.createdAt = admin.firestore.FieldValue.serverTimestamp();
        data.lastMessage = '';
        data.lastMessageAt = null;
        data.lastSenderId = null;
        data.lastMessageId = null;
      }

      await reference.set(data, { merge: true });
    }),
  );
}

async function createFirebaseToken({ userId, role }) {
  const assignments = await syncChatAccessForUser({ userId, role });

  const customToken = await firebaseAdminService.createCustomToken({
    userId,
    role,
  });

  return {
    customToken,
    userId,
    role,
    conversationIds: assignments.map((assignment) =>
      conversationId(assignment.playerId, assignment.trainerId)),
  };
}

async function syncChatAccessForUser({ userId, role }) {
  const assignments = await activeAssignmentsFor(userId, role);
  await syncConversations({ assignments, userId, role });
  return assignments;
}

module.exports = { createFirebaseToken, syncChatAccessForUser };
