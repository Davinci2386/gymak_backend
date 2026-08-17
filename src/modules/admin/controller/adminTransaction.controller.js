const { ApiResponse } = require('../../../utils');
const adminTransactionService = require('../service/adminTransaction.service');

async function listTransactions(req, res, next) {
  try {
    const result = await adminTransactionService.listTransactions(req.validatedQuery);

    return ApiResponse.success(res, {
      message: 'Transactions retrieved successfully',
      data: {
        transactions: result.transactions,
      },
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listTransactions,
};
