const { ApiResponse } = require('../../../utils');
const adminAnalyticsService = require('../service/adminAnalytics.service');

async function getSubscriptionKpis(req, res, next) {
  try {
    const data = await adminAnalyticsService.getSubscriptionKpis();

    return ApiResponse.success(res, {
      message: 'Subscription KPIs',
      data,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSubscriptionKpis,
};
