const Joi = require('joi');

const listTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').optional(),
  userId: Joi.string().uuid().optional(),
  planId: Joi.string().uuid().optional(),
  search: Joi.string().trim().min(1).max(100).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.when('dateFrom', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('dateFrom')),
    otherwise: Joi.date().iso(),
  }).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = {
  listTransactionsQuerySchema,
};
