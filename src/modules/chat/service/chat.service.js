const admin = require('firebase-admin');
const { prisma } = require('../../../config');
const { AppError } = require('../../../shared/errors');
const firebaseAdminService = require('../../../shared/services/firebaseAdmin.service');
const notificationService = require('../../notification/service/notification.service');
const logger = require('../../../utils/logger');

const assignmentInclude = {
  player: { select: { id: true, firstName: true, lastName: true } },
  trainer: { select: { id: true, firstName: true, lastName: true } },
};

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
      include: assignmentInclude,
    });
    return assignment ? [assignment] : [];
  }

  if (role === 'TRAINER') {
    return prisma.trainerAssignment.findMany({
      where: { trainerId: userId, status: 'ACTIVE' },
      include: assignmentInclude,
    });
  }

  throw new AppError('Only players and trainers can access chat', 403);
}

async function upsertConversation(assignment) {
  const firestore = firebaseAdminService.getFirestore();
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

  await Promise.all(assignments.map(upsertConversation));
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

async function activeAssignmentForMessage({ senderId, senderRole, playerId }) {
  if (senderRole === 'USER') {
    if (playerId && playerId !== senderId) {
      throw new AppError('Players can only send messages in their own conversation', 403);
    }

    return prisma.trainerAssignment.findFirst({
      where: { playerId: senderId, status: 'ACTIVE' },
      include: assignmentInclude,
    });
  }

  if (senderRole === 'TRAINER') {
    if (!playerId) {
      throw new AppError('playerId is required for trainer messages', 400);
    }

    return prisma.trainerAssignment.findFirst({
      where: {
        playerId,
        trainerId: senderId,
        status: 'ACTIVE',
      },
      include: assignmentInclude,
    });
  }

  throw new AppError('Only players and trainers can send chat messages', 403);
}

function notificationPreview(text) {
  if (text.length <= 180) return text;
  return `${text.slice(0, 177)}...`;
}

async function deliverMessageNotification({
  assignment,
  senderId,
  senderRole,
  receiverId,
  receiverRole,
  messageId,
  conversationId: id,
  text,
}) {
  const sender = senderRole === 'USER' ? assignment.player : assignment.trainer;
  const senderName = fullName(sender, senderRole === 'USER' ? 'Player' : 'Coach');

  try {
    const delivery = await notificationService.sendChatNotification({
      recipientId: receiverId,
      recipientRole: receiverRole,
      title: `New message from ${senderName}`,
      body: notificationPreview(text),
      data: {
        type: 'CHAT_MESSAGE',
        conversationId: id,
        messageId,
        senderId,
        senderRole,
        receiverId,
        playerId: assignment.playerId,
        trainerId: assignment.trainerId,
      },
    });

    return {
      status: delivery.status,
      sentCount: delivery.sentCount,
      failedCount: delivery.failedCount,
      inboxNotificationId: delivery.inboxNotificationId,
    };
  } catch (error) {
    logger.warn('Chat message was stored but its push notification failed', {
      conversationId: id,
      messageId,
      receiverId,
      error: error.message,
    });

    return {
      status: 'FAILED',
      sentCount: 0,
      failedCount: 0,
      inboxNotificationId: null,
    };
  }
}

async function sendTextMessage({
  senderId,
  senderRole,
  playerId,
  text,
  clientMessageId,
}) {
  const assignment = await activeAssignmentForMessage({
    senderId,
    senderRole,
    playerId,
  });

  if (!assignment) {
    throw new AppError('An active trainer assignment is required to send messages', 403);
  }

  const id = conversationId(assignment.playerId, assignment.trainerId);
  const firestore = firebaseAdminService.getFirestore();
  const conversationReference = firestore.collection('conversations').doc(id);
  const conversationSnapshot = await conversationReference.get();

  if (!conversationSnapshot.exists) {
    await upsertConversation(assignment);
  }

  const messageReference = clientMessageId
    ? conversationReference.collection('messages').doc(clientMessageId)
    : conversationReference.collection('messages').doc();
  const sentAt = admin.firestore.Timestamp.now();
  let created = true;
  let storedMessage = null;

  await firestore.runTransaction(async (transaction) => {
    const existingMessage = await transaction.get(messageReference);
    if (existingMessage.exists) {
      const existingData = existingMessage.data();
      if (existingData.senderId !== senderId || existingData.text !== text) {
        throw new AppError('clientMessageId is already used by another message', 409);
      }
      created = false;
      storedMessage = existingData;
      return;
    }

    const receiverId = senderRole === 'USER'
      ? assignment.trainerId
      : assignment.playerId;

    transaction.set(messageReference, {
      senderId,
      receiverId,
      text,
      type: 'text',
      sentAt,
      clientSentAt: sentAt,
    });
    storedMessage = {
      senderId,
      receiverId,
      text,
      type: 'text',
      sentAt,
      clientSentAt: sentAt,
    };
    transaction.set(conversationReference, {
      lastMessage: text,
      lastMessageId: messageReference.id,
      lastMessageAt: sentAt,
      lastSenderId: senderId,
      updatedAt: sentAt,
    }, { merge: true });
  });

  const receiverId = storedMessage.receiverId;
  const receiverRole = senderRole === 'USER' ? 'TRAINER' : 'USER';
  const notification = created
    ? await deliverMessageNotification({
      assignment,
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      messageId: messageReference.id,
      conversationId: id,
      text,
    })
    : { status: 'SKIPPED_DUPLICATE', sentCount: 0, failedCount: 0, inboxNotificationId: null };

  return {
    created,
    message: {
      id: messageReference.id,
      conversationId: id,
      senderId,
      receiverId,
      text,
      type: 'text',
      sentAt: storedMessage.sentAt.toDate().toISOString(),
    },
    notification,
  };
}

module.exports = {
  createFirebaseToken,
  syncChatAccessForUser,
  sendTextMessage,
};
