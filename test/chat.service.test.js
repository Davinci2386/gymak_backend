const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');

const { prisma } = require('../src/config');
const firebaseAdminService = require('../src/shared/services/firebaseAdmin.service');
const notificationService = require('../src/modules/notification/service/notification.service');
const chatService = require('../src/modules/chat/service/chat.service');

function stub(target, replacements) {
  const originals = {};
  for (const [key, replacement] of Object.entries(replacements)) {
    originals[key] = target[key];
    target[key] = replacement;
  }
  return () => {
    for (const [key, original] of Object.entries(originals)) target[key] = original;
  };
}

function assignment() {
  return {
    id: 'assignment-1',
    playerId: 'player-1',
    trainerId: 'trainer-1',
    status: 'ACTIVE',
    player: { id: 'player-1', firstName: 'Player', lastName: 'One' },
    trainer: { id: 'trainer-1', firstName: 'Coach', lastName: 'One' },
  };
}

function firestoreMock({ existingMessage = null } = {}) {
  const writes = [];
  const messageReference = { id: 'client-message-1' };
  const messages = {
    doc: (id) => {
      assert.equal(id, 'client-message-1');
      return messageReference;
    },
  };
  const conversationReference = {
    get: async () => ({ exists: true }),
    collection: (name) => {
      assert.equal(name, 'messages');
      return messages;
    },
  };
  const firestore = {
    collection: (name) => {
      assert.equal(name, 'conversations');
      return {
        doc: (id) => {
          assert.equal(id, 'player_player-1__trainer_trainer-1');
          return conversationReference;
        },
      };
    },
    runTransaction: async (callback) => callback({
      get: async () => ({
        exists: existingMessage !== null,
        data: () => existingMessage,
      }),
      set: (reference, data, options) => writes.push({ reference, data, options }),
    }),
  };

  return { firestore, writes };
}

test('stores a player message and notifies only the assigned trainer', async () => {
  const { firestore, writes } = firestoreMock();
  const restorePrisma = stub(prisma.trainerAssignment, {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { playerId: 'player-1', status: 'ACTIVE' });
      return assignment();
    },
  });
  const restoreFirebase = stub(firebaseAdminService, {
    getFirestore: () => firestore,
  });
  const restoreNotifications = stub(notificationService, {
    sendChatNotification: async (input) => {
      assert.equal(input.recipientId, 'trainer-1');
      assert.equal(input.recipientRole, 'TRAINER');
      assert.equal(input.data.type, 'CHAT_MESSAGE');
      assert.equal(input.data.messageId, 'client-message-1');
      return {
        status: 'SENT',
        sentCount: 1,
        failedCount: 0,
        inboxNotificationId: 'notification-1',
      };
    },
  });

  try {
    const result = await chatService.sendTextMessage({
      senderId: 'player-1',
      senderRole: 'USER',
      playerId: 'player-1',
      text: 'Hello coach',
      clientMessageId: 'client-message-1',
    });

    assert.equal(result.created, true);
    assert.equal(result.message.receiverId, 'trainer-1');
    assert.equal(result.notification.status, 'SENT');
    assert.equal(writes.length, 2);
    assert.equal(writes[0].data.text, 'Hello coach');
    assert.equal(writes[1].data.lastMessageId, 'client-message-1');
  } finally {
    restoreNotifications();
    restoreFirebase();
    restorePrisma();
  }
});

test('does not create a second notification when clientMessageId is retried', async () => {
  const originalSentAt = admin.firestore.Timestamp.fromDate(
    new Date('2026-08-16T12:00:00.000Z'),
  );
  const { firestore, writes } = firestoreMock({
    existingMessage: {
      senderId: 'trainer-1',
      receiverId: 'player-1',
      text: 'Already sent',
      type: 'text',
      sentAt: originalSentAt,
      clientSentAt: originalSentAt,
    },
  });
  const restorePrisma = stub(prisma.trainerAssignment, {
    findFirst: async () => assignment(),
  });
  const restoreFirebase = stub(firebaseAdminService, {
    getFirestore: () => firestore,
  });
  const restoreNotifications = stub(notificationService, {
    sendChatNotification: async () => {
      throw new Error('Duplicate requests must not notify again');
    },
  });

  try {
    const result = await chatService.sendTextMessage({
      senderId: 'trainer-1',
      senderRole: 'TRAINER',
      playerId: 'player-1',
      text: 'Already sent',
      clientMessageId: 'client-message-1',
    });

    assert.equal(result.created, false);
    assert.equal(result.notification.status, 'SKIPPED_DUPLICATE');
    assert.equal(result.message.sentAt, '2026-08-16T12:00:00.000Z');
    assert.equal(writes.length, 0);
  } finally {
    restoreNotifications();
    restoreFirebase();
    restorePrisma();
  }
});
