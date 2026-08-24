const { memoryDb } = require('../config/database');
const { ORDER_STATUS } = require('../config/constants');
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
    // Calculate pricing details
    const calculation = await rateService.calculateOrderCharge({
      pickupPincode,
      dropPincode,
      dimensions,
      actualWeight,
      orderType,
      paymentType
    });

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
      orderType,
      paymentType,
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

    // Record initial tracking history
    this.addTrackingHistory({
      orderId,
      status: ORDER_STATUS.CREATED,
      actor: 'CUSTOMER',
      actorId: customerId,
      notes: 'Order created successfully.'
    });

    // Auto-assignment if enabled
    if (autoAssign) {
      const bestAgent = await assignmentService.autoAssignAgent(newOrder, calculation.pickupZone);
      if (bestAgent) {
        newOrder.assignedAgentId = bestAgent.id;
        newOrder.status = ORDER_STATUS.ASSIGNED;
        this.addTrackingHistory({
          orderId,
          status: ORDER_STATUS.ASSIGNED,
          actor: 'SYSTEM',
          actorId: 'system',
          notes: `Auto-assigned to agent ${bestAgent.name}`
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

    const trackingHistory = memoryDb.trackingHistories
      .filter(th => th.orderId === id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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

  async updateOrderStatus(orderId, { newStatus, actor, actorId, notes, location }) {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    this.addTrackingHistory({
      orderId,
      status: newStatus,
      actor,
      actorId,
      notes: notes || `Status updated from ${prevStatus} to ${newStatus}`,
      location
    });

    const customer = memoryDb.users.find(u => u.id === order.customerId);
    if (customer) {
      notificationService.sendStatusEmail(customer.email, orderId, newStatus, notes);
      notificationService.sendStatusSMS(customer.phone, orderId, newStatus);
    }

    return order;
  }

  async assignAgent(orderId, agentId, actor = 'ADMIN', actorId = 'admin') {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const agent = memoryDb.users.find(u => u.id === agentId);
    if (!agent) throw new Error('Agent not found');

    order.assignedAgentId = agent.id;
    if (order.status === ORDER_STATUS.CREATED) {
      order.status = ORDER_STATUS.ASSIGNED;
    }
    order.updatedAt = new Date().toISOString();

    this.addTrackingHistory({
      orderId,
      status: order.status,
      actor,
      actorId,
      notes: `Order assigned to agent ${agent.name}`
    });

    return order;
  }

  async rescheduleOrder(orderId, { rescheduleDate, rescheduleReason }) {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.rescheduleDate = rescheduleDate;
    order.rescheduleReason = rescheduleReason;
    order.status = ORDER_STATUS.ASSIGNED;
    order.updatedAt = new Date().toISOString();

    const pickupZone = memoryDb.zones.find(z => z.id === order.pickupZoneId);
    const newAgent = await assignmentService.autoAssignAgent(order, pickupZone);
    if (newAgent) {
      order.assignedAgentId = newAgent.id;
    }

    this.addTrackingHistory({
      orderId,
      status: ORDER_STATUS.ASSIGNED,
      actor: 'CUSTOMER',
      actorId: order.customerId,
      notes: `Rescheduled for ${rescheduleDate}. Reason: ${rescheduleReason}`
    });

    return order;
  }

  addTrackingHistory({ orderId, status, actor, actorId, notes, location }) {
    const historyItem = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      status,
      actor,
      actorId,
      notes,
      location: location || null,
      timestamp: new Date().toISOString()
    };
    memoryDb.trackingHistories.push(historyItem);
    return historyItem;
  }
}

module.exports = new OrderService();