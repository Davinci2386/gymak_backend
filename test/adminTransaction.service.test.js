const test = require('node:test');
const assert = require('node:assert/strict');

const adminTransactionRepository = require('../src/modules/admin/repository/adminTransaction.repository');
const adminTransactionService = require('../src/modules/admin/service/adminTransaction.service');

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

test('returns filtered admin transactions with pagination and formatted amounts', async () => {
  const createdAt = new Date('2026-08-14T10:00:00.000Z');
  const restore = stub(adminTransactionRepository, {
    listTransactions: async ({ filters, skip, take, sortOrder }) => {
      assert.equal(filters.status, 'COMPLETED');
      assert.equal(filters.search, 'user@example.com');
      assert.equal(skip, 20);
      assert.equal(take, 20);
      assert.equal(sortOrder, 'desc');
      return [{
        id: 'payment-1',
        status: 'COMPLETED',
        amount: 2999,
        currency: 'USD',
        stripePaymentIntentId: 'pi_123',
        stripeChargeId: 'ch_123',
        errorMessage: null,
        user: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'user@example.com',
          accountStatus: 'ACTIVE',
        },
        plan: {
          id: 'plan-1',
          name: 'Gold Plan',
          price: 2999,
          durationDays: 30,
        },
        subscription: null,
        createdAt,
        updatedAt: createdAt,
      }];
    },
    countTransactions: async () => 25,
  });

  try {
    const result = await adminTransactionService.listTransactions({
      page: 2,
      limit: 20,
      status: 'COMPLETED',
      search: 'user@example.com',
      sortOrder: 'desc',
    });

    assert.equal(result.transactions[0].amount, 2999);
    assert.equal(result.transactions[0].amountFormatted, 'USD 29.99');
    assert.equal(result.transactions[0].user.fullName, 'Test User');
    assert.deepEqual(result.pagination, {
      currentPage: 2,
      perPage: 20,
      totalItems: 25,
      totalPages: 2,
    });
  } finally {
    restore();
  }
});
