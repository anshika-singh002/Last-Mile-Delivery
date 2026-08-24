import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { agentService } from '../../services/agentService';
import { socketService } from '../../services/socketService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Truck, MapPin, CheckCircle, XCircle, Power, Activity, Layers } from 'lucide-react';

export default function AssignedOrders({ onSelectOrder }) {
  const { addToast } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentProfile, setAgentProfile] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProfileAndOrders = async () => {
    try {
      const [ordRes, profRes] = await Promise.all([
        orderService.getOrders(),
        agentService.getProfile().catch(() => null)
      ]);

      if (ordRes.success) {
        setOrders(ordRes.data);
      }
      if (profRes?.success) {
        setAgentProfile(profRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const handleToggleAvailability = async () => {
    if (!agentProfile) return;
    setUpdatingStatus(true);
    try {
      const newAvailability = !agentProfile.isAvailable;
      const res = await agentService.updateLocation({
        isAvailable: newAvailability
      });
      if (res.success) {
        setAgentProfile(res.data);
        addToast(
          newAvailability
            ? 'You are now Online & Available for deliveries!'
            : 'You are now Offline (Not receiving auto-assignments)',
          newAvailability ? 'success' : 'info'
        );
        fetchProfileAndOrders();
      }
    } catch (err) {
      addToast('Failed to update availability', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [simulatingOrderId, setSimulatingOrderId] = useState(null);

  const handleSimulateLiveLocation = (order) => {
    if (!order) return;
    setSimulatingOrderId(order.id);
    socketService.connect();

    const pLat = Number(order.pickupLocation?.lat) || 28.6333;
    const pLng = Number(order.pickupLocation?.lng) || 77.2167;
    const dLat = Number(order.dropLocation?.lat) || 28.7041;
    const dLng = Number(order.dropLocation?.lng) || 77.1025;

    let step = 0;
    const totalSteps = 10;
    addToast(`Broadcasting live GPS location for Order #${order.id}...`, 'info');

    const interval = setInterval(() => {
      step += 1;
      const progress = step / totalSteps;
      const curLat = pLat + (dLat - pLat) * progress;
      const curLng = pLng + (dLng - pLng) * progress;

      socketService.sendLocationUpdate({
        orderId: order.id,
        lat: curLat,
        lng: curLng
      });

      if (step >= totalSteps) {
        clearInterval(interval);
        setSimulatingOrderId(null);
        addToast(`Agent reached destination for Order #${order.id}!`, 'success');
      }
    }, 2000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const res = await orderService.updateStatus(orderId, {
        status: newStatus,
        notes: `Agent updated status to ${newStatus}`
      });
      if (res.success) {
        addToast(`Order #${orderId} marked as ${newStatus}`, 'success');
        socketService.connect();

        // Broadcast current location along route based on status
        if (order) {
          const pLat = Number(order.pickupLocation?.lat) || 28.6333;
          const pLng = Number(order.pickupLocation?.lng) || 77.2167;
          const dLat = Number(order.dropLocation?.lat) || 28.7041;
          const dLng = Number(order.dropLocation?.lng) || 77.1025;

          let factor = 0.1;
          if (newStatus === 'PICKED_UP') factor = 0.2;
          if (newStatus === 'IN_TRANSIT') factor = 0.5;
          if (newStatus === 'OUT_FOR_DELIVERY') factor = 0.85;
          if (newStatus === 'DELIVERED') factor = 1.0;

          socketService.sendLocationUpdate({
            orderId,
            lat: pLat + (dLat - pLat) * factor,
            lng: pLng + (dLng - pLng) * factor
          });
        }

        fetchProfileAndOrders();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Loading assigned deliveries..." />;

  const activeDeliveriesCount = orders.filter(
    o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;
  const maxCapacity = agentProfile?.maxActiveDeliveries || 3;

  return (
    <div className="space-y-6">
      {/* Agent Status & Workload Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
              agentProfile?.isAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-base">
                {agentProfile?.name || 'Delivery Partner'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  agentProfile?.isAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {agentProfile?.isAvailable ? 'ONLINE & ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Zone: {agentProfile?.currentZoneId ? agentProfile.currentZoneId.toUpperCase() : 'All Covered'} • Auto-Assignment Ready
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Capacity Indicator */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Active Load:</span>
            <span className="font-bold text-white">
              {activeDeliveriesCount} / {maxCapacity} tasks
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                activeDeliveriesCount >= maxCapacity
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {activeDeliveriesCount >= maxCapacity ? 'AT CAPACITY' : 'ACCEPTING'}
            </span>
          </div>

          <button
            onClick={handleToggleAvailability}
            disabled={updatingStatus}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg ${
              agentProfile?.isAvailable
                ? 'bg-rose-600/90 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{agentProfile?.isAvailable ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white">Assigned Delivery Tasks</h2>
            <p className="text-xs text-slate-400">Update order status and send live GPS coordinate updates</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {orders.length} total orders ({activeDeliveriesCount} ongoing)
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center text-sm text-slate-400">
            No delivery tasks assigned currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-bold text-white text-base">#{order.id}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Customer: {order.customerName}</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-500/10 border-sky-500/30 text-sky-400 self-start sm:self-auto">
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pickup Location</span>
                    </span>
                    <p className="text-slate-200">{order.pickupAddress}</p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-rose-400 font-semibold flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Drop Location</span>
                    </span>
                    <p className="text-slate-200">{order.dropAddress}</p>
                  </div>
                </div>

                {/* Quick Status Action Buttons */}
                <div className="space-y-3 pt-3 border-t border-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Update Delivery Stage:</span>
                    </div>

                    <button
                      onClick={() => handleSimulateLiveLocation(order)}
                      disabled={simulatingOrderId === order.id}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md self-start sm:self-auto"
                    >
                      <Truck className="w-4 h-4 animate-pulse" />
                      <span>{simulatingOrderId === order.id ? 'Broadcasting Live Movement...' : '📡 Broadcast Live GPS Movement'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-1.5 ${
                        order.status === 'PICKED_UP'
                          ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/40'
                          : 'bg-slate-900 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                      }`}
                    >
                      <span>1. Picked Up</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-1.5 ${
                        order.status === 'IN_TRANSIT'
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                          : 'bg-slate-900 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                      }`}
                    >
                      <span>2. In Transit</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-1.5 ${
                        order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                          : 'bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      <span>3. Out For Delivery</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-1.5 ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                          : 'bg-slate-900 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>4. Delivered</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'FAILED')}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-1.5 ${
                        order.status === 'FAILED'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20 ring-2 ring-rose-400/40'
                          : 'bg-slate-900 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>5. Failed</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
