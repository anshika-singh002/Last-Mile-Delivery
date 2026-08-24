import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { useCurrency } from '../../context/CurrencyContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Package, Search, ExternalLink, Calendar, MapPin } from 'lucide-react';

export default function OrderList({ onSelectOrder }) {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await orderService.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <LoadingSpinner text="Fetching your orders..." />;

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.dropAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Your Orders History</h2>
          <p className="text-xs text-slate-400">Track and manage your delivery packages</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500 w-full sm:w-64"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-sm group-hover:text-sky-400 transition">
                    #{order.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 uppercase">
                    {order.orderType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                    {order.paymentType}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{order.pickupPincode}</span>
                  </span>
                  <span>→</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{order.dropPincode}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-6">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total</span>
                  <span className="text-sm font-bold text-white">{formatPrice(order.totalCharge)}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : order.status === 'FAILED'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    }`}
                  >
                    {order.status}
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
