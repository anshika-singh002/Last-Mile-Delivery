const bcrypt = require('bcryptjs');
const { USER_ROLES, ORDER_STATUS } = require('../config/constants');

// Initial seed store in memory for high-performance turnkey operation
const memoryDb = {
  users: [
    {
      id: 'cust-1',
      name: 'Alice Customer',
      email: 'customer@demo.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: USER_ROLES.CUSTOMER,
      phone: '+1 555-0199',
      address: '100 Market St, Zone Alpha'
    },
    {
      id: 'agent-1',
      name: 'Bob Agent (Delhi Hub)',
      email: 'agent1@demo.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: USER_ROLES.AGENT,
      phone: '+91 9876543210',
      isAvailable: true,
      maxActiveDeliveries: 3,
      currentZoneId: 'zone-1',
      currentLocation: { lat: 28.6333, lng: 77.2167 }
    },
    {
      id: 'agent-2',
      name: 'Charlie Agent (Bengaluru Hub)',
      email: 'agent2@demo.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: USER_ROLES.AGENT,
      phone: '+91 9876543211',
      isAvailable: true,
      maxActiveDeliveries: 3,
      currentZoneId: 'zone-2',
      currentLocation: { lat: 12.9716, lng: 77.5946 }
    },
    {
      id: 'agent-3',
      name: 'David Agent (Gujarat/Mumbai Hub)',
      email: 'agent3@demo.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: USER_ROLES.AGENT,
      phone: '+91 9876543212',
      isAvailable: true,
      maxActiveDeliveries: 3,
      currentZoneId: 'zone-3',
      currentLocation: { lat: 22.3030, lng: 73.2329 }
    },
    {
      id: 'admin-1',
      name: 'System Admin',
      email: 'admin@demo.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: USER_ROLES.ADMIN,
      phone: '+1 555-0000'
    }
  ],
  zones: [
    {
      id: 'zone-1',
      name: 'Delhi Central (Zone Alpha)',
      code: 'ALPHA',
      pincodes: ['110001', '110002', '110003', '94102', '94103'],
      centerLat: 28.6333,
      centerLng: 77.2167
    },
    {
      id: 'zone-2',
      name: 'Bengaluru Tech Corridor (Zone Beta)',
      code: 'BETA',
      pincodes: ['560001', '560034', '560066', '560100', '94104', '94105'],
      centerLat: 12.9716,
      centerLng: 77.5946
    },
    {
      id: 'zone-3',
      name: 'Mumbai Metro (Zone Gamma)',
      code: 'GAMMA',
      pincodes: ['400001', '400050', '400076', '10001', '94106', '94107'],
      centerLat: 18.9322,
      centerLng: 72.8347
    }
  ],
  rateCards: [
    {
      id: 'rate-1',
      orderType: 'B2C',
      isIntraZone: true,
      baseRate: 5.0,
      perKgRate: 1.5,
      codSurchargeRate: 2.0
    },
    {
      id: 'rate-2',
      orderType: 'B2C',
      isIntraZone: false,
      baseRate: 10.0,
      perKgRate: 2.5,
      codSurchargeRate: 2.0
    },
    {
      id: 'rate-3',
      orderType: 'B2B',
      isIntraZone: true,
      baseRate: 12.0,
      perKgRate: 1.0,
      codSurchargeRate: 3.5
    },
    {
      id: 'rate-4',
      orderType: 'B2B',
      isIntraZone: false,
      baseRate: 22.0,
      perKgRate: 1.8,
      codSurchargeRate: 3.5
    }
  ],
  orders: [
    {
      id: 'ord-101',
      customerId: 'cust-1',
      customerName: 'Alice Customer',
      pickupAddress: '123 Market St, Pincode 94102',
      pickupPincode: '94102',
      pickupZoneId: 'zone-1',
      dropAddress: '456 Mission St, Pincode 94105',
      dropPincode: '94105',
      dropZoneId: 'zone-2',
      dimensions: { length: 30, width: 20, height: 15 }, // Volumetric = (30*20*15)/5000 = 1.8kg
      actualWeight: 3.5, // Billable weight = 3.5kg
      volumetricWeight: 1.8,
      billableWeight: 3.5,
      orderType: 'B2C',
      paymentType: 'COD',
      baseCharge: 10.0, // Inter-zone B2C base rate
      weightCharge: 8.75, // 3.5 * 2.5
      codSurcharge: 2.0,
      totalCharge: 20.75,
      status: ORDER_STATUS.PICKED_UP,
      assignedAgentId: 'agent-1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  trackingHistories: [
    {
      id: 'th-1',
      orderId: 'ord-101',
      status: ORDER_STATUS.CREATED,
      actor: 'CUSTOMER',
      actorId: 'cust-1',
      notes: 'Order placed by customer.',
      location: null,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'th-2',
      orderId: 'ord-101',
      status: ORDER_STATUS.ASSIGNED,
      actor: 'SYSTEM',
      actorId: 'system',
      notes: 'Auto-assigned to nearest agent Bob Agent (Alpha)',
      location: null,
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      id: 'th-3',
      orderId: 'ord-101',
      status: ORDER_STATUS.PICKED_UP,
      actor: 'AGENT',
      actorId: 'agent-1',
      notes: 'Package picked up from customer location.',
      location: { lat: 37.7749, lng: -122.4194 },
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ]
};

module.exports = {
  memoryDb
};
