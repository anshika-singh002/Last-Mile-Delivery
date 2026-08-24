'use strict';
const assert = require('assert');
const notificationService = require('./src/services/notificationService');
const orderService = require('./src/services/orderService');

async function testNotificationPipeline() {
  console.log('--- Testing Real Email & SMS Notification Pipeline ---');

  // Test 1: Direct HTML Email transmission verification
  const emailRes = await notificationService.sendStatusEmail(
    'testcustomer@example.com',
    'ord-notif-101',
    'OUT_FOR_DELIVERY',
    'Package is arriving in 15 minutes with delivery agent.'
  );

  console.log('Test 1 - Email sent result:', emailRes.success, '| MessageId:', emailRes.messageId);
  assert.strictEqual(emailRes.success, true);
  assert.strictEqual(emailRes.to, 'testcustomer@example.com');
  assert.strictEqual(emailRes.status, 'OUT_FOR_DELIVERY');

  // Test 2: Direct SMS transmission verification
  const smsRes = await notificationService.sendStatusSMS(
    '+1555019922',
    'ord-notif-101',
    'OUT_FOR_DELIVERY'
  );

  console.log('Test 2 - SMS dispatched result:', smsRes.success, '| SID:', smsRes.sid);
  assert.strictEqual(smsRes.success, true);
  assert.strictEqual(smsRes.to, '+1555019922');

  // Test 3: Status transition end-to-end trigger in orderService
  const order = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Alice Customer',
    pickupAddress: '200 Main St',
    pickupPincode: '94102',
    dropAddress: '300 Post St',
    dropPincode: '94105',
    dimensions: { length: 20, width: 20, height: 10 },
    actualWeight: 2.0,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    autoAssign: true
  });

  console.log('Test 3 - Order created:', order.id);

  // Transition through delivery lifecycle
  const transitions = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  for (const st of transitions) {
    await orderService.updateOrderStatus(order.id, {
      newStatus: st,
      actor: 'AGENT',
      actorId: 'agent-1',
      notes: `Agent advanced status to ${st}`
    });
  }

  const logs = notificationService.getNotificationLogs(order.id);
  console.log('Test 3b - Total notifications logged for order lifecycle:', logs.length);
  assert(logs.length >= transitions.length, 'Each status change must trigger automated notification');

  const deliveredEmail = logs.find(l => l.status === 'DELIVERED' && l.type === 'EMAIL');
  assert(deliveredEmail != null, 'Delivered status must trigger email');
  assert.strictEqual(deliveredEmail.success, true);

  console.log('✅ ALL EMAIL AND SMS NOTIFICATION PIPELINE TESTS PASSED!');
}

testNotificationPipeline().catch(err => {
  console.error('❌ Notification test failed:', err);
  process.exit(1);
});
