const { memoryDb } = require('../config/database');
const { USER_ROLES, ORDER_STATUS } = require('../config/constants');
const { calculateHaversineDistance } = require('../utils/haversine');
const TrackingHistory = require('../models/TrackingHistory');

const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY
];

class AssignmentService {
  /**
   * Calculates the number of currently active orders assigned to an agent.
   */
  getActiveDeliveryCount(agentId) {
    if (!agentId || !memoryDb.orders) return 0;
    return memoryDb.orders.filter(
      o => o.assignedAgentId === agentId && ACTIVE_ORDER_STATUSES.includes(o.status)
    ).length;
  }

  /**
   * Check if an agent is currently available and has spare capacity.
   */
  isAgentEligible(agent) {
    if (!agent || agent.role !== USER_ROLES.AGENT) return false;
    if (agent.isAvailable === false) return false;

    const maxCapacity = agent.maxActiveDeliveries || 3;
    const activeCount = this.getActiveDeliveryCount(agent.id);
    return activeCount < maxCapacity;
  }

  /**
   * Finds the best available agent for an order based on zone matching,
   * haversine proximity to the pickup point, and active workload balancing.
   *
   * @param {Object} order - The order requiring assignment.
   * @param {Object} pickupZone - The detected pickup zone object (contains id, centerLat, centerLng).
   * @returns {Object} { success: boolean, agent: Object|null, distanceKm: number|null, isZoneMatch: boolean, reason: string }
   */
  async autoAssignAgent(order, pickupZone) {
    // 1. Fetch all registered agents and filter by eligibility
    const allAgents = (memoryDb.users || []).filter(u => u.role === USER_ROLES.AGENT);
    const eligibleAgents = allAgents.filter(agent => this.isAgentEligible(agent));

    if (!eligibleAgents || eligibleAgents.length === 0) {
      const busyAgentsCount = allAgents.filter(a => a.isAvailable !== false).length;
      return {
        success: false,
        agent: null,
        distanceKm: null,
        isZoneMatch: false,
        reason: allAgents.length === 0
          ? 'No delivery agents registered in the system.'
          : busyAgentsCount === 0
            ? 'All delivery agents are currently offline or unavailable.'
            : 'All available delivery agents have reached maximum active delivery capacity.'
      };
    }

    const pickupLat = pickupZone?.centerLat != null ? parseFloat(pickupZone.centerLat) : 37.7749;
    const pickupLng = pickupZone?.centerLng != null ? parseFloat(pickupZone.centerLng) : -122.4194;
    const pickupZoneId = pickupZone?.id || order?.pickupZoneId;

    // 2. Score and rank eligible agents
    const scoredAgents = eligibleAgents.map(agent => {
      let distance = Infinity;
      const isZoneMatch = Boolean(pickupZoneId && agent.currentZoneId === pickupZoneId);
      const activeCount = this.getActiveDeliveryCount(agent.id);
      const maxCapacity = agent.maxActiveDeliveries || 3;

      if (agent.currentLocation && agent.currentLocation.lat != null && agent.currentLocation.lng != null) {
        distance = calculateHaversineDistance(
          pickupLat,
          pickupLng,
          parseFloat(agent.currentLocation.lat),
          parseFloat(agent.currentLocation.lng)
        );
      } else if (isZoneMatch) {
        // Agent is in the same zone but coordinates aren't tracked; assign favorable estimated distance
        distance = 1.5;
      } else if (agent.currentZoneId) {
        // Check distance to agent's assigned zone center
        const agentZone = (memoryDb.zones || []).find(z => z.id === agent.currentZoneId);
        if (agentZone && agentZone.centerLat != null && agentZone.centerLng != null) {
          distance = calculateHaversineDistance(
            pickupLat,
            pickupLng,
            parseFloat(agentZone.centerLat),
            parseFloat(agentZone.centerLng)
          );
        } else {
          distance = 20.0;
        }
      } else {
        distance = 30.0;
      }

      return {
        agent,
        distance: Number(distance.toFixed(2)),
        isZoneMatch,
        activeCount,
        capacityRatio: activeCount / maxCapacity
      };
    });

    // 3. Sorting hierarchy:
    // Priority A: Zone Match (same zone preferred)
    // Priority B: Proximity (lowest haversine distance)
    // Priority C: Workload balance (fewer active deliveries)
    scoredAgents.sort((a, b) => {
      if (a.isZoneMatch !== b.isZoneMatch) {
        return a.isZoneMatch ? -1 : 1;
      }
      if (Math.abs(a.distance - b.distance) > 0.5) {
        return a.distance - b.distance;
      }
      return a.activeCount - b.activeCount;
    });

    const bestMatch = scoredAgents[0];

    return {
      success: true,
      agent: bestMatch.agent,
      distanceKm: bestMatch.distance,
      isZoneMatch: bestMatch.isZoneMatch,
      activeDeliveries: bestMatch.activeCount,
      reason: bestMatch.isZoneMatch
        ? `Assigned nearest agent in zone (${bestMatch.distance} km away, ${bestMatch.activeCount} active task(s))`
        : `Assigned nearest available agent from neighboring area (${bestMatch.distance} km away, ${bestMatch.activeCount} active task(s))`
    };
  }

  /**
   * Scans unassigned / pending orders and attempts auto-assignment.
   * Useful when an agent finishes an order or marks themselves available.
   */
  async processPendingQueue() {
    if (!memoryDb.orders) return [];

    const unassignedOrders = memoryDb.orders.filter(
      o => !o.assignedAgentId && (o.status === ORDER_STATUS.CREATED || o.status === 'PENDING_ASSIGNMENT')
    );

    const assignedResults = [];

    for (const order of unassignedOrders) {
      const pickupZone = (memoryDb.zones || []).find(z => z.id === order.pickupZoneId);
      const assignment = await this.autoAssignAgent(order, pickupZone);

      if (assignment.success && assignment.agent) {
        order.assignedAgentId = assignment.agent.id;
        order.status = ORDER_STATUS.ASSIGNED;
        order.updatedAt = new Date().toISOString();

        TrackingHistory.append({
          orderId: order.id,
          status: ORDER_STATUS.ASSIGNED,
          previousStatus: ORDER_STATUS.CREATED,
          actor: 'SYSTEM',
          actorId: 'system',
          actorName: 'Auto-Assignment Dispatcher',
          notes: `Auto-assigned from queue: ${assignment.reason}`,
          location: assignment.agent.currentLocation || null,
          metadata: {
            agentId: assignment.agent.id,
            distanceKm: assignment.distanceKm,
            isZoneMatch: assignment.isZoneMatch
          }
        });
        assignedResults.push({ orderId: order.id, agent: assignment.agent });
      }
    }

    return assignedResults;
  }
}

module.exports = new AssignmentService();
