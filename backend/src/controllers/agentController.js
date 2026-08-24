const { memoryDb } = require('../config/database');
const { USER_ROLES } = require('../config/constants');
const assignmentService = require('../services/assignmentService');

exports.getAgentProfile = async (req, res, next) => {
  try {
    const agent = memoryDb.users.find(u => u.id === req.user.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const activeDeliveries = assignmentService.getActiveDeliveryCount(agent.id);
    const maxCapacity = agent.maxActiveDeliveries || 3;

    res.json({
      success: true,
      data: {
        ...agent,
        activeDeliveries,
        maxActiveDeliveries: maxCapacity,
        isEligible: assignmentService.isAgentEligible(agent)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAgentLocation = async (req, res, next) => {
  try {
    const { lat, lng, zoneId, isAvailable, maxActiveDeliveries } = req.body;
    const agent = memoryDb.users.find(u => u.id === req.user.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    if (lat != null && lng != null) {
      agent.currentLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    if (zoneId) agent.currentZoneId = zoneId;
    if (maxActiveDeliveries != null) agent.maxActiveDeliveries = parseInt(maxActiveDeliveries, 10);

    const wasUnavailable = agent.isAvailable === false;
    if (isAvailable != null) {
      agent.isAvailable = Boolean(isAvailable);
    }

    // If agent switched from offline to online, drain any pending unassigned order queue
    if (wasUnavailable && agent.isAvailable === true) {
      assignmentService.processPendingQueue().catch(err => {
        console.error('Error processing pending queue on agent availability toggle:', err);
      });
    }

    const activeDeliveries = assignmentService.getActiveDeliveryCount(agent.id);
    const maxCapacity = agent.maxActiveDeliveries || 3;

    res.json({
      success: true,
      data: {
        ...agent,
        activeDeliveries,
        maxActiveDeliveries: maxCapacity,
        isEligible: assignmentService.isAgentEligible(agent)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllAgents = async (req, res, next) => {
  try {
    const agents = memoryDb.users
      .filter(u => u.role === USER_ROLES.AGENT)
      .map(agent => {
        const activeDeliveries = assignmentService.getActiveDeliveryCount(agent.id);
        const maxCapacity = agent.maxActiveDeliveries || 3;
        return {
          ...agent,
          activeDeliveries,
          maxActiveDeliveries: maxCapacity,
          isEligible: assignmentService.isAgentEligible(agent)
        };
      });
    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
};
