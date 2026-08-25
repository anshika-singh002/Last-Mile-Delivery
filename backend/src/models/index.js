/**
 * Central Data Models Registry & Entity Definitions for Last-Mile Delivery
 */

const TrackingHistory = require('./TrackingHistory');

const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN'
};

const ORDER_STATUS = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED'
};

const ORDER_TYPES = {
  B2B: 'B2B',
  B2C: 'B2C'
};

const PAYMENT_TYPES = {
  PREPAID: 'PREPAID',
  COD: 'COD'
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  TrackingHistory
};
