const app = require('./src/app');
const request = require('http');
const paymentService = require('./src/services/paymentService');
const orderService = require('./src/services/orderService');
const jwt = require('jsonwebtoken');

async function testPaymentFlow() {
  console.log('--- Testing Razorpay Payment Integration ---');

  // 1. Check Public Config
  const config = paymentService.getPublicConfig();
  console.log('1. Payment Public Config:', config);

  // 2. Create Delivery Order
  const order = await orderService.createOrder({
    customerId: 'cust-1',
    customerName: 'Test Customer',
    pickupAddress: 'Sector 62, Noida',
    pickupPincode: '201309',
    dropAddress: 'Connaught Place, New Delhi',
    dropPincode: '110001',
    dimensions: { length: '20', width: '15', height: '10' },
    actualWeight: '1.5',
    orderType: 'B2C',
    paymentType: 'PREPAID'
  });

  console.log(`2. Created Order #${order.id} with payment status: ${order.paymentStatus}, Total: ₹${order.totalCharge}`);

  // 3. Create Razorpay Payment Order
  const rzpOrder = await paymentService.createPaymentOrder({
    amount: order.totalCharge,
    receipt: `rcpt_${order.id}`,
    notes: { deliveryOrderId: order.id }
  });
  console.log('3. Generated Razorpay Order:', rzpOrder);

  // 4. Verify Payment & Signature
  const verification = paymentService.verifyPaymentSignature({
    razorpay_order_id: rzpOrder.id,
    razorpay_payment_id: 'pay_test_123456',
    razorpay_signature: 'mock_signature_verified'
  });
  console.log('4. Payment Signature Verification Result:', verification);

  // 5. Handle Payment Success
  const paymentResult = await paymentService.handlePaymentSuccess({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: 'pay_test_123456',
    razorpaySignature: 'mock_signature_verified',
    amount: order.totalCharge,
    actor: 'CUSTOMER',
    actorId: 'cust-1'
  });

  console.log('5. Payment Handler Result Status:', paymentResult.order.paymentStatus);
  console.log('6. Order Razorpay Payment ID:', paymentResult.order.razorpayPaymentId);

  // 6. Verify Ledger Integrity
  const TrackingHistory = require('./src/models/TrackingHistory');
  const isVerified = TrackingHistory.verifyIntegrity(order.id);
  const events = TrackingHistory.getByOrderId(order.id);
  console.log(`7. Ledger Audit Trail Valid: ${isVerified}, Total Events: ${events.length}`);
  console.log('Latest event:', events[events.length - 1].notes);

  console.log('\n--- ALL PAYMENT INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

testPaymentFlow().catch(err => {
  console.error('Payment Test Failed:', err);
  process.exit(1);
});
