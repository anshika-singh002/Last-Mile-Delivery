'use strict';
const assert = require('assert');
const orderService = require('./src/services/orderService');

async function testDynamicMapAndAgentStatus() {
  console.log('--- Testing Dynamic Coordinates & Agent Status Update ---');

  // Test 1: Order created with Zone 1 (94102) to Zone 3 (94107)
  const order = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Alice Customer',
    pickupAddress: '100 Market St, Zone 1',
    pickupPincode: '94102',
    dropAddress: '700 4th St, Zone 3',
    dropPincode: '94107',
    dimensions: { length: 15, width: 10, height: 10 },
    actualWeight: 1.5,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    autoAssign: true
  });

  console.log('Order created -> pickupLocation:', order.pickupLocation, '| dropLocation:', order.dropLocation);
  assert(order.pickupLocation && typeof order.pickupLocation.lat === 'number');
  assert(order.dropLocation && typeof order.dropLocation.lat === 'number');

  // Test 2: Fetch by ID returns dynamic coordinates
  const fetchedOrder = await orderService.getOrderById(order.id);
  console.log('Fetched order dropLocation coordinates:', fetchedOrder.dropLocation);
  assert.strictEqual(fetchedOrder.dropLocation.lat, 37.79);
  assert.strictEqual(fetchedOrder.dropLocation.lng, -122.40);

  // Test 3: Agent updates status to PICKED_UP and then OUT_FOR_DELIVERY
  const updated1 = await orderService.updateOrderStatus(order.id, {
    status: 'PICKED_UP',
    actor: 'AGENT',
    actorId: 'agent-1',
    notes: 'Agent confirmed pickup'
  });
  console.log('Status updated by agent to:', updated1.status);
  assert.strictEqual(updated1.status, 'PICKED_UP');

  const updated2 = await orderService.updateOrderStatus(order.id, {
    status: 'OUT_FOR_DELIVERY',
    actor: 'AGENT',
    actorId: 'agent-1',
    notes: 'Agent is 5 mins away'
  });
  console.log('Status updated by agent to:', updated2.status);
  assert.strictEqual(updated2.status, 'OUT_FOR_DELIVERY');

  console.log('✅ DYNAMIC MAP COORDINATES & AGENT STATUS UPDATE TESTS PASSED!');
}

testDynamicMapAndAgentStatus().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
