const { memoryDb } = require('../config/database');
const { ORDER_STATUS } = require('../config/constants');
const TrackingHistory = require('../models/TrackingHistory');
const rateService = require('./rateService');
const assignmentService = require('./assignmentService');
const notificationService = require('./notificationService');

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

    const normalizedOrderType = String(orderType || '').toUpperCase();
    const normalizedPaymentType = String(paymentType || '').toUpperCase();
    const orderId = `ord-${Date.now()}`;

    const newOrder = {
      id: orderId,
      customerId,
      customerName: customerName || 'Customer',
      pickupAddress,
      pickupPincode,
      pickupZoneId: calculation.pickupZone ? calculation.pickupZone.id : null,
      dropAddress,
      dropPincode,
      dropZoneId: calculation.dropZone ? calculation.dropZone.id : null,
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

    return {
      ...order,
      trackingHistory,
      assignedAgent: agent ? { id: agent.id, name: agent.name, phone: agent.phone } : null
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

  async updateOrderStatus(orderId, { newStatus, actor, actorId, notes, location, reason }) {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    const actorUser = memoryDb.users.find(u => u.id === actorId);

    this.addTrackingHistory({
      orderId,
      status: newStatus,
      previousStatus: prevStatus,
      actor,
      actorId,
      actorName: actorUser ? actorUser.name : actor,
      notes: notes || `Status updated from ${prevStatus} to ${newStatus}`,
      reason,
      location
    });

    const customer = memoryDb.users.find(u => u.id === order.customerId);
    if (customer) {
      notificationService.sendStatusEmail(customer.email, orderId, newStatus, notes);
      notificationService.sendStatusSMS(customer.phone, orderId, newStatus);
    }

    // When an order is completed or failed, freeing up agent capacity, process queued pending orders
    if (newStatus === ORDER_STATUS.DELIVERED || newStatus === ORDER_STATUS.FAILED) {
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

    const prevStatus = order.status;
    order.rescheduleDate = rescheduleDate;
    order.rescheduleReason = rescheduleReason;
    order.updatedAt = new Date().toISOString();

    const pickupZone = memoryDb.zones.find(z => z.id === order.pickupZoneId);
    const assignment = await assignmentService.autoAssignAgent(order, pickupZone);

    if (assignment.success && assignment.agent) {
      order.assignedAgentId = assignment.agent.id;
      order.status = ORDER_STATUS.ASSIGNED;
      this.addTrackingHistory({
        orderId,
        status: ORDER_STATUS.ASSIGNED,
        previousStatus: prevStatus,
        actor: 'CUSTOMER',
        actorId: order.customerId,
        actorName: order.customerName,
        notes: `Rescheduled for ${rescheduleDate}. Reason: ${rescheduleReason}. Auto-assigned: ${assignment.reason}`,
        reason: rescheduleReason,
        metadata: { rescheduleDate, assignedAgentId: assignment.agent.id }
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
        notes: `Rescheduled for ${rescheduleDate}. Reason: ${rescheduleReason}. Fallback: ${assignment.reason}. Queued for assignment.`,
        reason: rescheduleReason,
        metadata: { rescheduleDate }
      });
    }

    return order;
  }

  addTrackingHistory(eventData) {
    return TrackingHistory.append(eventData);
  }
}

module.exports = new OrderService();