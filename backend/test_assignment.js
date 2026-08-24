
const assert = require('assert');
const { memoryDb } = require('./src/config/database');
const assignmentService = require('./src/services/assignmentService');
const orderService = require('./src/services/orderService');
const { ORDER_STATUS } = require('./src/config/constants');

async function runTests() {
  console.log('--- Starting Auto-Assignment & Availability Tests ---');

  // Test 1: Nearest agent selection in same zone
  const zone1 = memoryDb.zones.find(z => z.id === 'zone-1');
  const dummyOrder1 = { id: 'test-ord-1', pickupZoneId: 'zone-1' };
  
  // Ensure agent-1 is online and has no active load
  const agent1 = memoryDb.users.find(u => u.id === 'agent-1');
  const agent2 = memoryDb.users.find(u => u.id === 'agent-2');
  agent1.isAvailable = true;
  agent2.isAvailable = true;
  
  const res1 = await assignmentService.autoAssignAgent(dummyOrder1, zone1);
  console.log('Test 1 - Assign in Zone 1:', res1.agent?.name, '| Reason:', res1.reason);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.agent.id, 'agent-1');
  assert.strictEqual(res1.isZoneMatch, true);

  // Test 2: Fallback to neighboring zone agent when zone agent is offline
  agent1.isAvailable = false;
  const res2 = await assignmentService.autoAssignAgent(dummyOrder1, zone1);
  console.log('Test 2 - Fallback to Agent 2 (Zone 2):', res2.agent?.name, '| Reason:', res2.reason);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.agent.id, 'agent-2');
  assert.strictEqual(res2.isZoneMatch, false);

  // Test 3: Capacity limit test (agent at max capacity is skipped)
  agent2.maxActiveDeliveries = 1;
  // Make agent-2 busy with 1 active order
  memoryDb.orders.push({
    id: 'active-ord-dummy',
    assignedAgentId: 'agent-2',
    status: ORDER_STATUS.PICKED_UP
  });
  
  const res3 = await assignmentService.autoAssignAgent(dummyOrder1, zone1);
  console.log('Test 3 - When all available agents are at capacity or offline:', res3.success, '| Reason:', res3.reason);
  assert.strictEqual(res3.success, false);
  assert.strictEqual(res3.agent, null);

  // Test 4: End-to-end createOrder with unassigned queue fallback
  const createdOrder = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Alice Customer',
    pickupAddress: '123 Market St',
    pickupPincode: '94102',
    dropAddress: '456 Mission St',
    dropPincode: '94105',
    dimensions: { length: 20, width: 20, height: 10 },
    actualWeight: 2,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    autoAssign: true
  });
  console.log('Test 4 - Order created without available agents -> Status:', createdOrder.status, '| AgentId:', createdOrder.assignedAgentId);
  assert.strictEqual(createdOrder.status, ORDER_STATUS.CREATED);
  assert.strictEqual(createdOrder.assignedAgentId, null);

  // Test 5: Queue processing when agent goes online
  agent1.isAvailable = true;
  agent1.maxActiveDeliveries = 3;
  const queuedResults = await assignmentService.processPendingQueue();
  console.log('Test 5 - Pending queue processed on agent online:', queuedResults.length, 'orders assigned');
  assert(queuedResults.length >= 1);
  const updatedOrder = memoryDb.orders.find(o => o.id === createdOrder.id);
  assert.strictEqual(updatedOrder.status, ORDER_STATUS.ASSIGNED);
  assert.strictEqual(updatedOrder.assignedAgentId, 'agent-1');

  console.log('✅ ALL AUTO-ASSIGNMENT & AVAILABILITY TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
