import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Smartphone, Building, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function RazorpayModal({
  isOpen,
  orderDetails,
  onSuccess,
  onFailure,
  onClose
}) {
  const { formatPrice } = useCurrency();
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('customer@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !orderDetails) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      // Simulate realistic payment gateway processing delay
      await new Promise(r => setTimeout(r, 1200));

      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const mockOrderId = orderDetails.id || `order_${Math.random().toString(36).substring(2, 10)}`;

      if (onSuccess) {
        onSuccess({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'mock_signature_verified',
          deliveryOrderId: orderDetails.deliveryOrderId,
          amount: orderDetails.amount
        });
      }
    } catch (err) {
      if (onFailure) onFailure(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        {/* Razorpay Branded Top Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight">Razorpay</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                  Test Gateway
                </span>
              </div>
              <p className="text-[11px] text-blue-100">Last-Mile Logistics Express</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-200 block uppercase font-bold">Amount to Pay</span>
            <span className="text-base font-extrabold text-white">
              {formatPrice(orderDetails.amount)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handlePay} className="p-6 space-y-5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                selectedMethod === 'upi'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[11px]">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                selectedMethod === 'card'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[11px]">Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                selectedMethod === 'netbanking'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span className="text-[11px]">NetBanking</span>
            </button>
          </div>

          {/* Form Fields according to method */}
          {selectedMethod === 'upi' && (
            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Virtual Payment Address (UPI ID)
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Google Pay, PhonePe, Paytm, BHIM ready</span>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Valid Thru
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Popular Bank
              </label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option>HDFC Bank</option>
                <option>State Bank of India</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                {processing ? 'Processing Payment...' : `Pay ${formatPrice(orderDetails.amount)} Now`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition"
            >
              Cancel & Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
