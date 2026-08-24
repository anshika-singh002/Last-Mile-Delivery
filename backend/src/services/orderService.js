const { memoryDb } = require('../config/database');
const { ORDER_STATUS } = require('../config/constants');
const TrackingHistory = require('../models/TrackingHistory');
const rateService = require('./rateService');
const assignmentService = require('./assignmentService');
const notificationService = require('./notificationService');

const { geocodePincode } = require('../utils/geocoder');

class OrderService {
  async createOrder({
    customerId,
    customerName,
    pickupAddress,
    pickupPincode,
    dropAddress,
    dropPincode,
    dimensions,
    actualWeight,
    orderType,
    paymentType,
    autoAssign = true
  }) {
    const calculation = await rateService.calculateOrderCharge({
      pickupPincode,
      dropPincode,
      dimensions,
      actualWeight,
      orderType,
      paymentType
    });

    const normalizedOrderType = String(orderType || 'B2C').toUpperCase();
    const normalizedPaymentType = String(paymentType || '').toUpperCase();
    const orderId = `ord-${Date.now()}`;

    const pickupZone = calculation.pickupZone;
    const dropZone = calculation.dropZone;

    // 1. Resolve exact coordinates via geocoder or zone fallback
    let pickupLocation = null;
    let dropLocation = null;

    const [pickupGeo, dropGeo] = await Promise.all([
      geocodePincode(pickupPincode),
      geocodePincode(dropPincode)
    ]);

    if (pickupGeo) {
      pickupLocation = { lat: pickupGeo.lat, lng: pickupGeo.lng };
    } else if (pickupZone) {
      pickupLocation = { lat: pickupZone.centerLat, lng: pickupZone.centerLng };
    } else {
      pickupLocation = { lat: 28.6139, lng: 77.2090 };
    }

    if (dropGeo) {
      dropLocation = { lat: dropGeo.lat, lng: dropGeo.lng };
    } else if (dropZone) {
      dropLocation = { lat: dropZone.centerLat, lng: dropZone.centerLng };
    } else {
      dropLocation = { lat: 28.7041, lng: 77.1025 };
    }

    const newOrder = {
      id: orderId,
      customerId,
      customerName: customerName || 'Customer',
      pickupAddress,
      pickupPincode,
      pickupZoneId: pickupZone ? pickupZone.id : null,
      pickupLocation,
      dropAddress,
      dropPincode,
      dropZoneId: dropZone ? dropZone.id : null,
      dropLocation,
      dimensions: {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height)
      },
      actualWeight: parseFloat(actualWeight),
      volumetricWeight: calculation.volumetricWeight,
      billableWeight: calculation.billableWeight,
      orderType: normalizedOrderType,
      paymentType: normalizedPaymentType,
      baseCharge: calculation.baseCharge,
      weightCharge: calculation.weightCharge,
      codSurcharge: calculation.codSurcharge,
      totalCharge: calculation.totalCharge,
      status: ORDER_STATUS.CREATED,
      assignedAgentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryDb.orders.unshift(newOrder);

    this.addTrackingHistory({
      orderId,
      status: ORDER_STATUS.CREATED,
      actor: 'CUSTOMER',
      actorId: customerId,
      notes: 'Order created successfully.'
    });

    if (autoAssign) {
      const assignment = await assignmentService.autoAssignAgent(newOrder, calculation.pickupZone);
      if (assignment.success && assignment.agent) {
        newOrder.assignedAgentId = assignment.agent.id;
        newOrder.status = ORDER_STATUS.ASSIGNED;
        this.addTrackingHistory({
          orderId,
          status: ORDER_STATUS.ASSIGNED,
          actor: 'SYSTEM',
          actorId: 'system',
          notes: `Auto-assignment: ${assignment.reason}`
        });
      } else {
        // Fallback when no agent is currently available or under capacity
        this.addTrackingHistory({
          orderId,
          status: ORDER_STATUS.CREATED,
          actor: 'SYSTEM',
          actorId: 'system',
          notes: `Auto-assignment fallback: ${assignment.reason || 'No available agents'}. Queued for auto-assignment.`
        });
      }
    }

    const customer = memoryDb.users.find(u => u.id === customerId);
    if (customer) {
      notificationService.sendStatusEmail(customer.email, orderId, newOrder.status);
    }

    return newOrder;
  }

  async getOrderById(id) {
    const order = memoryDb.orders.find(o => o.id === id);
    if (!order) return null;

    const trackingHistory = TrackingHistory.getByOrderId(id);

    const agent = order.assignedAgentId
      ? memoryDb.users.find(u => u.id === order.assignedAgentId)
      : null;

    const pickupZone = order.pickupZoneId
      ? memoryDb.zones.find(z => z.id === order.pickupZoneId)
      : null;
    const dropZone = order.dropZoneId
      ? memoryDb.zones.find(z => z.id === order.dropZoneId)
      : null;

    let pickupLocation = order.pickupLocation;
    let dropLocation = order.dropLocation;

    if (!pickupLocation) {
      if (pickupZone) {
        pickupLocation = { lat: pickupZone.centerLat, lng: pickupZone.centerLng };
      } else {
        const geo = await geocodePincode(order.pickupPincode);
        pickupLocation = geo ? { lat: geo.lat, lng: geo.lng } : { lat: 28.6139, lng: 77.2090 };
      }
    }

    if (!dropLocation) {
      if (dropZone) {
        dropLocation = { lat: dropZone.centerLat, lng: dropZone.centerLng };
      } else {
        const geo = await geocodePincode(order.dropPincode);
        dropLocation = geo ? { lat: geo.lat, lng: geo.lng } : { lat: 28.7041, lng: 77.1025 };
      }
    }

    return {
      ...order,
      pickupLocation,
      dropLocation,
      trackingHistory,
      assignedAgent: agent ? { id: agent.id, name: agent.name, phone: agent.phone, currentLocation: agent.currentLocation } : null
    };
  }

  async getOrders(filters = {}) {
    let result = [...(memoryDb.orders || [])];

    if (filters.customerId) {
      result = result.filter(o => o.customerId === filters.customerId);
    }
    if (filters.assignedAgentId) {
      result = result.filter(o => o.assignedAgentId === filters.assignedAgentId);
    }
    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }
    if (filters.zoneId) {
      result = result.filter(o => o.pickupZoneId === filters.zoneId || o.dropZoneId === filters.zoneId);
    }

    return result.map(order => {
      const agent = order.assignedAgentId ? memoryDb.users.find(u => u.id === order.assignedAgentId) : null;
      return {
        ...order,
        assignedAgentName: agent ? agent.name : 'Unassigned'
      };
    });
  }

  async updateOrderStatus(orderId, { newStatus, status, actor, actorId, notes, location, reason }) {
    const targetStatus = newStatus || status;
    if (!targetStatus) throw new Error('Status is required');

    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = targetStatus;
    order.updatedAt = new Date().toISOString();

    const actorUser = memoryDb.users.find(u => u.id === actorId);

    this.addTrackingHistory({
      orderId,
      status: targetStatus,
      previousStatus: prevStatus,
      actor: actor || 'AGENT',
      actorId: actorId || 'system',
      actorName: actorUser ? actorUser.name : (actor || 'Agent'),
      notes: notes || `Status updated from ${prevStatus} to ${targetStatus}`,
      reason,
      location
    });

    const customer = memoryDb.users.find(u => u.id === order.customerId);
    if (customer) {
      if (targetStatus === ORDER_STATUS.FAILED) {
        await notificationService.notifyFailedDelivery(customer, orderId, reason || notes);
      } else {
        await notificationService.sendStatusEmail(customer.email, orderId, targetStatus, notes);
        await notificationService.sendStatusSMS(customer.phone, orderId, targetStatus);
      }
    }

    // When an order is completed or failed, freeing up agent capacity, process queued pending orders
    if (targetStatus === ORDER_STATUS.DELIVERED || targetStatus === ORDER_STATUS.FAILED) {
      assignmentService.processPendingQueue().catch(err => {
        console.error('Error processing pending queue after status update:', err);
      });
    }

    return order;
  }

  async assignAgent(orderId, agentId, actor = 'ADMIN', actorId = 'admin') {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const agent = memoryDb.users.find(u => u.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const prevStatus = order.status;
    order.assignedAgentId = agent.id;
    if (order.status === ORDER_STATUS.CREATED) {
      order.status = ORDER_STATUS.ASSIGNED;
    }
    order.updatedAt = new Date().toISOString();

    this.addTrackingHistory({
      orderId,
      status: order.status,
      previousStatus: prevStatus,
      actor,
      actorId,
      actorName: actor === 'ADMIN' ? 'System Admin' : agent.name,
      notes: `Order manually assigned to agent ${agent.name}`,
      metadata: { assignedAgentId: agent.id, assignedAgentName: agent.name }
    });

    return order;
  }

  async triggerAutoAssign(orderId) {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const pickupZone = memoryDb.zones.find(z => z.id === order.pickupZoneId);
    const assignment = await assignmentService.autoAssignAgent(order, pickupZone);

    if (!assignment.success || !assignment.agent) {
      this.addTrackingHistory({
        orderId,
        status: order.status,
        previousStatus: order.status,
        actor: 'SYSTEM',
        actorId: 'system',
        actorName: 'Auto-Assignment Dispatcher',
        notes: `Auto-assignment attempted: ${assignment.reason}`
      });
      return {
        success: false,
        message: assignment.reason,
        order
      };
    }

    const prevStatus = order.status;
    order.assignedAgentId = assignment.agent.id;
    if (order.status === ORDER_STATUS.CREATED) {
      order.status = ORDER_STATUS.ASSIGNED;
    }
    order.updatedAt = new Date().toISOString();

    this.addTrackingHistory({
      orderId,
      status: order.status,
      previousStatus: prevStatus,
      actor: 'SYSTEM',
      actorId: 'system',
      actorName: 'Auto-Assignment Dispatcher',
      notes: `Auto-assignment: ${assignment.reason}`,
      location: assignment.agent.currentLocation || null,
      metadata: {
        agentId: assignment.agent.id,
        distanceKm: assignment.distanceKm,
        isZoneMatch: assignment.isZoneMatch
      }
    });

    return {
      success: true,
      data: order,
      assignment
    };
  }

  async rescheduleOrder(orderId, { rescheduleDate, rescheduleReason }) {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (!rescheduleDate) {
      throw new Error('Reschedule date is required');
    }

    const prevStatus = order.status;
    order.rescheduleDate = rescheduleDate;
    order.rescheduleReason = rescheduleReason || 'Customer requested reschedule';
    order.updatedAt = new Date().toISOString();

    // Trigger fresh auto-assignment cycle to find an available active agent
    const pickupZone = memoryDb.zones.find(z => z.id === order.pickupZoneId);
    const assignment = await assignmentService.autoAssignAgent(order, pickupZone);

    let assignedAgent = null;

    if (assignment.success && assignment.agent) {
      assignedAgent = assignment.agent;
      order.assignedAgentId = assignment.agent.id;
      order.status = ORDER_STATUS.ASSIGNED;
      this.addTrackingHistory({
        orderId,
        status: ORDER_STATUS.ASSIGNED,
        previousStatus: prevStatus,
        actor: 'CUSTOMER',
        actorId: order.customerId,
        actorName: order.customerName,
        notes: `Rescheduled for ${rescheduleDate}. Reason: ${order.rescheduleReason}. Auto-assigned: ${assignment.reason}`,
        reason: order.rescheduleReason,
        metadata: { rescheduleDate, assignedAgentId: assignment.agent.id, assignedAgentName: assignment.agent.name }
      });
    } else {
      order.assignedAgentId = null;
      order.status = ORDER_STATUS.CREATED;
      this.addTrackingHistory({
        orderId,
        status: ORDER_STATUS.CREATED,
        previousStatus: prevStatus,
        actor: 'CUSTOMER',
        actorId: order.customerId,
        actorName: order.customerName,
        notes: `Rescheduled for ${rescheduleDate}. Reason: ${order.rescheduleReason}. Fallback: ${assignment.reason}. Queued for auto-assignment.`,
        reason: order.rescheduleReason,
        metadata: { rescheduleDate }
      });
    }

    // Notify customer about reschedule confirmation and newly assigned agent
    const customer = memoryDb.users.find(u => u.id === order.customerId);
    if (customer) {
      notificationService.notifyRescheduled(customer, orderId, rescheduleDate, assignedAgent);
    }

    return order;
  }

  addTrackingHistory(eventData) {
    return TrackingHistory.append(eventData);
  }
}

module.exports = new OrderService();