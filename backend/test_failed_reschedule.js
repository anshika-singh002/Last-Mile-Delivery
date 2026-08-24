'use strict';
const assert = require('assert');
const orderService = require('./src/services/orderService');
const { memoryDb } = require('./src/config/database');
const TrackingHistory = require('./src/models/TrackingHistory');

async function testFailedAndRescheduleFlow() {
  console.log('--- Testing Failed Delivery + Reschedule Flow ---');

  // Step 1: Create an active order with registered pincodes (94102 and 94105)
  const order = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Alice Customer',
    pickupAddress: '200 Main St',
    pickupPincode: '94102',
    dropAddress: '300 Post St',
    dropPincode: '94105',
    dimensions: { length: 25, width: 20, height: 15 },
    actualWeight: 3.0,
    orderType: 'B2C',
    paymentType: 'COD',
    autoAssign: true
  });

  console.log('Step 1: Order created with ID:', order.id, '| Initial Status:', order.status, '| Initial Agent:', order.assignedAgentId);

  // Step 2: Agent attempts delivery and flags FAILED
  const failedOrder = await orderService.updateOrderStatus(order.id, {
    newStatus: 'FAILED',
    actor: 'AGENT',
    actorId: 'agent-1',
    notes: 'Customer gate code invalid, no response to phone calls.',
    reason: 'Recipient unreachable'
  });

  console.log('Step 2: Order marked FAILED -> Status:', failedOrder.status);
  assert.strictEqual(failedOrder.status, 'FAILED');

  const failedTimeline = TrackingHistory.getByOrderId(order.id);
  const failEvent = failedTimeline[failedTimeline.length - 1];
  assert.strictEqual(failEvent.status, 'FAILED');
  assert.strictEqual(failEvent.actor, 'AGENT');
  console.log('Step 2b: Verified failed tracking event logged:', failEvent.notes);

  // Step 3: Customer captures reschedule date and instructions
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const reschedulePayload = {
    rescheduleDate: tomorrow,
    rescheduleReason: 'Customer will be home after 4 PM, gate code is #4321'
  };

  const rescheduledOrder = await orderService.rescheduleOrder(order.id, reschedulePayload);
  console.log('Step 3: Reschedule confirmed -> New Status:', rescheduledOrder.status, '| New Assigned Agent:', rescheduledOrder.assignedAgentId);
  
  assert.strictEqual(rescheduledOrder.rescheduleDate, tomorrow);
  assert.strictEqual(rescheduledOrder.status, 'ASSIGNED');
  assert(rescheduledOrder.assignedAgentId != null, 'Agent should be reassigned');

  // Step 4: Verify complete lifecycle audit trail
  const fullTimeline = TrackingHistory.getByOrderId(order.id);
  console.log('Step 4: Full timeline events count:', fullTimeline.length);
  const rescheduleEvent = fullTimeline[fullTimeline.length - 1];
  assert.strictEqual(rescheduleEvent.status, 'ASSIGNED');
  assert.strictEqual(rescheduleEvent.previousStatus, 'FAILED');
  assert.strictEqual(rescheduleEvent.actor, 'CUSTOMER');
  assert.strictEqual(rescheduleEvent.reason, reschedulePayload.rescheduleReason);

  // Step 5: Verify ledger integrity
  const isIntegrityValid = TrackingHistory.verifyIntegrity(order.id);
  console.log('Step 5: Ledger integrity verified:', isIntegrityValid);
  assert.strictEqual(isIntegrityValid, true);

  console.log('✅ ALL FAILED DELIVERY + RESCHEDULE FLOW TESTS PASSED!');
}

testFailedAndRescheduleFlow().catch(err => {
  console.error('❌ Failed delivery test error:', err);
  process.exit(1);
});
