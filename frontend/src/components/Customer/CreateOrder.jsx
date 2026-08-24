import React, { useState } from 'react';
import { PackagePlus, MapPin, Box, DollarSign } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useNotification } from '../../context/NotificationContext';
import ChargePreview from './ChargePreview';

export default function CreateOrder({ onOrderCreated }) {
  const { addToast } = useNotification();
  const [formData, setFormData] = useState({
    pickupAddress: '123 Market St',
    pickupPincode: '94102',
    dropAddress: '789 Mission St',
    dropPincode: '94105',
    dimensions: { length: '30', width: '20', height: '15' },
    actualWeight: '2.5',
    orderType: 'B2C',
    paymentType: 'COD'
  });

  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    try {
      const res = await orderService.previewCharge(formData);
      if (res.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error calculating rate preview', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await orderService.createOrder(formData);
      if (res.success) {
        addToast(`Order ${res.data.id} created successfully!`, 'success');
        if (onOrderCreated) onOrderCreated(res.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
          <PackagePlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Create New Delivery Order</h2>
          <p className="text-xs text-slate-400">Auto-calculate pricing & assign nearest available agent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Pickup Details</span>
            </h3>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Pickup Address</label>
              <input
                type="text"
                required
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Pincode</label>
              <input
                type="text"
                required
                value={formData.pickupPincode}
                onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
                onBlur={handlePreview}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Drop Details</span>
            </h3>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Drop Address</label>
              <input
                type="text"
                required
                value={formData.dropAddress}
                onChange={(e) => setFormData({ ...formData, dropAddress: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Pincode</label>
              <input
                type="text"
                required
                value={formData.dropPincode}
                onChange={(e) => setFormData({ ...formData, dropPincode: e.target.value })}
                onBlur={handlePreview}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Package & Weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dimensions (L × W × H cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="L"
                value={formData.dimensions.length}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: { ...formData.dimensions, length: e.target.value }
                  })
                }
                onBlur={handlePreview}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-sky-500"
              />
              <input
                type="number"
                placeholder="W"
                value={formData.dimensions.width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: { ...formData.dimensions, width: e.target.value }
                  })
                }
                onBlur={handlePreview}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-sky-500"
              />
              <input
                type="number"
                placeholder="H"
                value={formData.dimensions.height}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: { ...formData.dimensions, height: e.target.value }
                  })
                }
                onBlur={handlePreview}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Actual Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.actualWeight}
              onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })}
              onBlur={handlePreview}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Type</label>
              <select
                value={formData.orderType}
                onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                onBlur={handlePreview}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment</label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                onBlur={handlePreview}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="COD">COD</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charge Preview */}
        {previewData ? (
          <ChargePreview previewData={previewData} />
        ) : (
          <div className="text-center py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={handlePreview}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              Click to Calculate Charge Breakdown
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-500/20 transition duration-200"
        >
          {loading ? 'Creating Order...' : 'Confirm & Place Order'}
        </button>
      </form>
    </div>
  );
}
