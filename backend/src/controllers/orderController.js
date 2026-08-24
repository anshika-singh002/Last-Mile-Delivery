const orderService = require('../services/orderService');
const rateService = require('../services/rateService');

exports.previewCharge = async (req, res, next) => {
  try {
    const calculation = await rateService.calculateOrderCharge(req.body);
    res.json({ success: true, data: calculation });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.role === 'CUSTOMER' ? req.user.id : (req.body.customerId || req.user.id);
    const order = await orderService.createOrder({
      ...req.body,
      customerId,
      customerName: req.user.name
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      filters.assignedAgentId = req.user.id;
    } else if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.zoneId) filters.zoneId = req.query.zoneId;
    if (req.query.agentId) filters.assignedAgentId = req.query.agentId;

    const orders = await orderService.getOrders(filters);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes, location } = req.body;
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, {
      newStatus: status,
      actor: req.user.role,
      actorId: req.user.id,
      notes,
      location
    });
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    next(err);
  }
};

exports.assignAgent = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const updatedOrder = await orderService.assignAgent(req.params.id, agentId, req.user.role, req.user.id);
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    next(err);
  }
};

exports.reschedule = async (req, res, next) => {
  try {
    const updatedOrder = await orderService.rescheduleOrder(req.params.id, req.body);
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    next(err);
  }
};
