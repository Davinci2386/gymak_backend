const { paginate, buildPaginationMeta } = require('../../../utils');
const adminTransactionRepository = require('../repository/adminTransaction.repository');

function formatAmount(amount, currency) {
  const normalizedCurrency = String(currency || 'USD').toUpperCase();
  return `${normalizedCurrency} ${(amount / 100).toFixed(2)}`;
}

function mapTransaction(transaction) {
  return {
    id: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    amountFormatted: formatAmount(transaction.amount, transaction.currency),
    currency: transaction.currency,
    stripePaymentIntentId: transaction.stripePaymentIntentId,
    stripeChargeId: transaction.stripeChargeId,
    errorMessage: transaction.errorMessage,
    user: {
      ...transaction.user,
      fullName: `${transaction.user.firstName} ${transaction.user.lastName}`.trim(),
    },
    plan: transaction.plan,
    subscription: transaction.subscription,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

async function listTransactions(query = {}) {
  const paginationInput = paginate(query);
  const filters = {
    status: query.status,
    userId: query.userId,
    planId: query.planId,
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };

  const [transactions, totalItems] = await Promise.all([
    adminTransactionRepository.listTransactions({
      filters,
      skip: paginationInput.skip,
      take: paginationInput.perPage,
      sortOrder: query.sortOrder || 'desc',
    }),
    adminTransactionRepository.countTransactions(filters),
  ]);

  return {
    transactions: transactions.map(mapTransaction),
    pagination: buildPaginationMeta({
      currentPage: paginationInput.currentPage,
      perPage: paginationInput.perPage,
      totalItems,
    }),
  };
}

module.exports = {
  listTransactions,
};
