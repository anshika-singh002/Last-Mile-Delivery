const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');

exports.getConfig = async (req, res, next) => {
  try {
    const config = paymentService.getPublicConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { amount, currency, receipt, notes, deliveryOrderId } = req.body;
    
    let orderAmount = amount;
    if (!orderAmount && deliveryOrderId) {
      const deliveryOrder = await orderService.getOrderById(deliveryOrderId);
      if (deliveryOrder) {
        orderAmount = deliveryOrder.totalCharge;
      }
    }

    if (!orderAmount) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const razorpayOrder = await paymentService.createPaymentOrder({
      amount: orderAmount,
      currency: currency || 'INR',
      receipt: receipt || (deliveryOrderId ? `rcpt_${deliveryOrderId}` : undefined),
      notes: {
        ...(notes || {}),
        deliveryOrderId: deliveryOrderId || null,
        customerId: req.user?.id || 'anonymous'
      }
    });

    res.json({
      success: true,
      data: {
        ...razorpayOrder,
        keyId: paymentService.getPublicConfig().keyId
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryOrderId,
      amount
    } = req.body;

    const verification = paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: verification.reason || 'Payment verification failed'
      });
    }

    let updatedOrder = null;
    if (deliveryOrderId) {
      const result = await paymentService.handlePaymentSuccess({
        orderId: deliveryOrderId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount,
        actor: req.user?.role || 'CUSTOMER',
        actorId: req.user?.id || 'customer'
      });
      updatedOrder = result.order;
    }

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully',
      data: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        order: updatedOrder
      }
    });
  } catch (err) {
    next(err);
  }
};
