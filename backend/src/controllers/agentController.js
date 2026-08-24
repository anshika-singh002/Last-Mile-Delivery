const { memoryDb } = require('../config/database');
const { USER_ROLES } = require('../config/constants');

exports.getAgentProfile = async (req, res, next) => {
  try {
    const agent = memoryDb.users.find(u => u.id === req.user.id);
    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
};

exports.updateAgentLocation = async (req, res, next) => {
  try {
    const { lat, lng, zoneId, isAvailable } = req.body;
    const agent = memoryDb.users.find(u => u.id === req.user.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    if (lat != null && lng != null) {
      agent.currentLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    if (zoneId) agent.currentZoneId = zoneId;
    if (isAvailable != null) agent.isAvailable = Boolean(isAvailable);

    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
};

exports.getAllAgents = async (req, res, next) => {
  try {
    const agents = memoryDb.users.filter(u => u.role === USER_ROLES.AGENT);
    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
};
