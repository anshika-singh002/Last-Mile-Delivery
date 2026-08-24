import React, { useState } from 'react';
import { Calendar, AlertTriangle, X } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useNotification } from '../../context/NotificationContext';

export default function RescheduleModal({ orderId, onClose, onSuccess }) {
  const { addToast } = useNotification();
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return addToast('Please select a new delivery date', 'error');

    setLoading(true);
    try {
      const res = await orderService.rescheduleOrder(orderId, {
        rescheduleDate,
        rescheduleReason
      });
      if (res.success) {
        addToast('Order rescheduled successfully! Agent reassigned.', 'success');
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Reschedule failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Reschedule Failed Delivery</h3>
            <p className="text-xs text-slate-400">Order #{orderId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              New Delivery Date
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Reason / Instructions
            </label>
            <textarea
              rows={3}
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="e.g. Customer was unavailable on previous attempt."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
