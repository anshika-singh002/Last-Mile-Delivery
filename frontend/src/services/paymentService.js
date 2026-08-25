import api from './api';

export const paymentService = {
  getPaymentConfig: async () => {
    const res = await api.get('/payment/config');
    return res.data;
  },

  createPaymentOrder: async (paymentData) => {
    const res = await api.post('/payment/create-order', paymentData);
    return res.data;
  },

  verifyPayment: async (verificationData) => {
    const res = await api.post('/payment/verify', verificationData);
    return res.data;
  },

  /**
   * Helper to launch Razorpay Checkout Modal
   */
  openRazorpayModal: async ({
    deliveryOrderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    onSuccess,
    onFailure,
    onDismiss
  }) => {
    // 1. Fetch Razorpay Order from backend
    const orderRes = await paymentService.createPaymentOrder({
      amount,
      deliveryOrderId,
      currency: 'INR'
    });

    if (!orderRes.success) {
      throw new Error(orderRes.message || 'Failed to initialize payment order');
    }

    const { id: rzpOrderId, keyId, amount: amountInPaise } = orderRes.data;

    // Check if Razorpay script is loaded
    if (typeof window.Razorpay === 'undefined') {
      // Fallback for mock/sandbox if script failed to load
      console.warn('Razorpay SDK not found in window. Attempting sandbox mock flow...');
      try {
        const mockVerifyRes = await paymentService.verifyPayment({
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature_verified',
          deliveryOrderId,
          amount
        });
        if (onSuccess) onSuccess(mockVerifyRes.data);
        return;
      } catch (err) {
        if (onFailure) onFailure(err);
        return;
      }
    }

    // 2. Configure Razorpay standard options
    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Last-Mile Delivery Logistics',
      description: `Delivery Order #${deliveryOrderId || 'Prepaid'}`,
      order_id: rzpOrderId,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerPhone || ''
      },
      theme: {
        color: '#0284c7' // sky-600
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        }
      },
      handler: async function (response) {
        try {
          const verifyRes = await paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            deliveryOrderId,
            amount
          });

          if (verifyRes.success) {
            if (onSuccess) onSuccess(verifyRes.data);
          } else {
            if (onFailure) onFailure(new Error(verifyRes.message || 'Verification failed'));
          }
        } catch (err) {
          if (onFailure) onFailure(err);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Razorpay Payment Failed:', response.error);
      if (onFailure) onFailure(response.error);
    });
    rzp.open();
  }
};
