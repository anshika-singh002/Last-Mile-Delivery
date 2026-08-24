'use strict';
const assert = require('assert');
const TrackingHistory = require('./src/models/TrackingHistory');
const orderService = require('./src/services/orderService');
const { memoryDb } = require('./src/config/database');

async function testImmutableTracking() {
  console.log('--- Testing Immutable Tracking History Model & Ledger ---');

  // Test 1: Append event with full schema validation
  const testOrderId = 'test-ord-immutable-1';
  const event1 = TrackingHistory.append({
    orderId: testOrderId,
    status: 'CREATED',
    previousStatus: null,
    actor: 'CUSTOMER',
    actorId: 'cust-1',
    actorName: 'Alice Customer',
    notes: 'Order initiated for standard delivery.'
  });

  console.log('Test 1 - Event created:', event1.id, '| Hash:', event1.eventHash);
  assert(event1.id.startsWith('th-'));
  assert.strictEqual(event1.actor, 'CUSTOMER');
  assert.strictEqual(event1.actorName, 'Alice Customer');
  assert(event1.eventHash && event1.eventHash.length === 64);

  // Test 2: Runtime Object.freeze immutability check
  assert.throws(() => {
    event1.notes = 'Attempted tamper notes';
  }, TypeError, 'Direct mutation should throw error on frozen object');

  // Test 3: Status transition event & timeline order
  const event2 = TrackingHistory.append({
    orderId: testOrderId,
    status: 'ASSIGNED',
    previousStatus: 'CREATED',
    actor: 'SYSTEM',
    actorId: 'system',
    notes: 'Auto-assigned to nearest delivery partner.'
  });

  const timeline = TrackingHistory.getByOrderId(testOrderId);
  console.log('Test 3 - Timeline length:', timeline.length);
  assert.strictEqual(timeline.length, 2);
  assert.strictEqual(timeline[0].status, 'CREATED');
  assert.strictEqual(timeline[1].status, 'ASSIGNED');

  // Test 4: Cryptographic verification of ledger
  const isValid = TrackingHistory.verifyIntegrity(testOrderId);
  console.log('Test 4 - Ledger integrity check:', isValid);
  assert.strictEqual(isValid, true);

  // Test 5: End-to-end orderService order update lifecycle tracking
  const createdOrder = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Alice Customer',
    pickupAddress: '789 Howard St',
    pickupPincode: '94103',
    dropAddress: '101 California St',
    dropPincode: '94104',
    dimensions: { length: 15, width: 15, height: 15 },
    actualWeight: 1.5,
    orderType: 'B2C',
    paymentType: 'COD',
    autoAssign: true
  });

  const orderTimeline = TrackingHistory.getByOrderId(createdOrder.id);
  console.log('Test 5 - Order created lifecycle events:', orderTimeline.length);
  assert(orderTimeline.length >= 1);
  assert.strictEqual(orderTimeline[0].orderId, createdOrder.id);

  const initialStatus = createdOrder.status; // 'ASSIGNED'

  // Advance order status
  await orderService.updateOrderStatus(createdOrder.id, {
    newStatus: 'PICKED_UP',
    actor: 'AGENT',
    actorId: 'agent-1',
    notes: 'Agent arrived and scanned barcode'
  });

  const updatedTimeline = TrackingHistory.getByOrderId(createdOrder.id);
  console.log('Test 5b - Updated lifecycle events count:', updatedTimeline.length);
  const lastEvent = updatedTimeline[updatedTimeline.length - 1];
  assert.strictEqual(lastEvent.status, 'PICKED_UP');
  assert.strictEqual(lastEvent.previousStatus, initialStatus);

  console.log('✅ ALL IMMUTABLE TRACKING HISTORY TESTS PASSED!');
}

testImmutableTracking().catch(err => {
  console.error('❌ Tracking history test failed:', err);
  process.exit(1);
});
