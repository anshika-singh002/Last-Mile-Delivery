const { memoryDb } = require('../config/database');
const { USER_ROLES } = require('../config/constants');

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalOrders = memoryDb.orders.length;
    const delivered = memoryDb.orders.filter(o => o.status === 'DELIVERED').length;
    const failed = memoryDb.orders.filter(o => o.status === 'FAILED').length;
    const active = totalOrders - delivered - failed;

    const totalRevenue = memoryDb.orders.reduce((sum, o) => sum + (o.totalCharge || 0), 0);
    const totalAgents = memoryDb.users.filter(u => u.role === USER_ROLES.AGENT).length;
    const availableAgents = memoryDb.users.filter(u => u.role === USER_ROLES.AGENT && u.isAvailable).length;

    res.json({
      success: true,
      data: {
        totalOrders,
        delivered,
        failed,
        active,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalAgents,
        availableAgents,
        zonesCount: memoryDb.zones.length
      }
    });
  } catch (err) {
    next(err);
  }
};
