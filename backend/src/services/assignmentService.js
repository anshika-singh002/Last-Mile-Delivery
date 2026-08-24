const { memoryDb } = require('../config/database');
const { USER_ROLES } = require('../config/constants');
const { calculateHaversineDistance } = require('../utils/haversine');

class AssignmentService {
  async autoAssignAgent(order, pickupZone) {
    // 1. Get all available agents
    const availableAgents = memoryDb.users.filter(
      u => u.role === USER_ROLES.AGENT && u.isAvailable !== false
    );

    if (!availableAgents || availableAgents.length === 0) {
      return null;
    }

    const pickupLat = pickupZone?.centerLat || 37.7749;
    const pickupLng = pickupZone?.centerLng || -122.4194;

    // 2. Score agents based on distance to pickup zone center & zone match
    let bestAgent = null;
    let shortestDistance = Infinity;

    for (const agent of availableAgents) {
      let distance = Infinity;
      if (agent.currentLocation && agent.currentLocation.lat && agent.currentLocation.lng) {
        distance = calculateHaversineDistance(
          pickupLat,
          pickupLng,
          agent.currentLocation.lat,
          agent.currentLocation.lng
        );
      } else if (agent.currentZoneId && pickupZone && agent.currentZoneId === pickupZone.id) {
        distance = 1.0; // Same zone boost
      } else {
        distance = 25.0; // Fallback estimate
      }

      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }
}

module.exports = new AssignmentService();
