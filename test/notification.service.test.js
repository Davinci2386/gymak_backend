const test = require('node:test');
const assert = require('node:assert/strict');

const notificationRepo = require('../src/modules/notification/repository/notification.repository');
const notificationService = require('../src/modules/notification/service/notification.service');

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

test('lists the authenticated user notifications with unread count and pagination', async () => {
  const restore = stub(notificationRepo, {
    listUserNotifications: async ({ userId, unreadOnly, skip, take }) => {
      assert.equal(userId, 'user-1');
      assert.equal(unreadOnly, true);
      assert.equal(skip, 20);
      assert.equal(take, 20);
      return [{
        id: 'notification-1',
        title: 'Hello',
        body: 'World',
        data: { type: 'test' },
        readAt: null,
        createdAt: new Date('2026-08-13T12:00:00.000Z'),
      }];
    },
    countUserNotifications: async () => 21,
    countUnreadUserNotifications: async () => 7,
  });

  try {
    const result = await notificationService.listMyNotifications({
      userId: 'user-1',
      page: '2',
      limit: '20',
      unreadOnly: 'true',
    });

    assert.equal(result.notifications.length, 1);
    assert.equal(result.notifications[0].isRead, false);
    assert.equal(result.unreadCount, 7);
    assert.deepEqual(result.pagination, {
      currentPage: 2,
      perPage: 20,
      totalItems: 21,
      totalPages: 2,
    });
  } finally {
    restore();
  }
});

test('does not allow marking a notification outside the authenticated user inbox', async () => {
  const restore = stub(notificationRepo, {
    markUserNotificationAsRead: async () => ({ count: 0 }),
  });

  try {
    await assert.rejects(
      notificationService.markNotificationAsRead({
        userId: 'user-1',
        notificationId: 'someone-elses-notification',
      }),
      (error) => error.statusCode === 404 && error.message === 'Notification not found',
    );
  } finally {
    restore();
  }
});

test('stores a direct notification even when the recipient has no FCM token', async () => {
  let stored = null;
  const restore = stub(notificationRepo, {
    findActiveUserById: async () => ({
      id: 'user-1',
      role: 'USER',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    }),
    createUserNotification: async (data) => {
      stored = data;
      return { id: 'inbox-1', ...data };
    },
    listDeviceTokensByUserId: async () => [],
    createNotificationLog: async (data) => ({ id: 'log-1', ...data }),
  });

  try {
    const result = await notificationService.sendUserNotification({
      adminId: 'admin-1',
      userId: 'user-1',
      title: 'Stored notification',
      body: 'No device is registered',
      data: { type: 'test' },
    });

    assert.deepEqual(stored, {
      userId: 'user-1',
      title: 'Stored notification',
      body: 'No device is registered',
      data: { type: 'test' },
    });
    assert.equal(result.inboxNotificationId, 'inbox-1');
    assert.equal(result.status, 'FAILED');
    assert.equal(result.sentCount, 0);
  } finally {
    restore();
  }
});

test('stores a broadcast for all targeted accounts, including accounts without devices', async () => {
  let storedUserIds = [];
  const restore = stub(notificationRepo, {
    listActiveRecipientsByAudience: async () => [{ id: 'user-1' }, { id: 'user-2' }],
    listDeviceTokensByAudience: async () => [{ token: 'token-1', userId: 'user-1' }],
    createUserNotifications: async ({ userIds }) => {
      storedUserIds = userIds;
      return { count: userIds.length };
    },
  });

  const firebaseAdminService = require('../src/shared/services/firebaseAdmin.service');
  const restoreFirebase = stub(firebaseAdminService, {
    sendMulticastNotification: async () => ({
      sentCount: 1,
      failedCount: 0,
      invalidTokens: [],
    }),
  });
  const restoreLog = stub(notificationRepo, {
    createNotificationLog: async (data) => ({ id: 'log-1', ...data }),
  });

  try {
    const result = await notificationService.sendBroadcastNotification({
      adminId: 'admin-1',
      audienceRole: 'USER',
      title: 'Broadcast',
      body: 'For every user',
      data: {},
    });

    assert.deepEqual(storedUserIds, ['user-1', 'user-2']);
    assert.equal(result.storedNotifications, 2);
    assert.equal(result.targetedDevices, 1);
    assert.equal(result.sentCount, 1);
  } finally {
    restoreLog();
    restoreFirebase();
    restore();
  }
});
