import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { socketService } from '../../services/socketService';
import LoadingSpinner from '../Common/LoadingSpinner';
import TrackingMap from './TrackingMap';
import RescheduleModal from './RescheduleModal';
import { Package, Clock, MapPin, CheckCircle, AlertTriangle, ArrowLeft, Truck, User } from 'lucide-react';

export default function OrderTracking({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentLocation, setAgentLocation] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    socketService.connect();
    socketService.joinOrderRoom(orderId);

    socketService.onLocationUpdate((data) => {
      if (data.orderId === orderId) {
        setAgentLocation(data.location);
      }
    });

    socketService.onStatusUpdate((data) => {
      if (data.orderId === orderId) {
        fetchOrderDetails();
      }
    });

    return () => {
      // room cleanup
    };
  }, [orderId]);

  if (loading) return <LoadingSpinner text="Fetching live tracking information..." />;
  if (!order) return <div className="text-white text-center p-8">Order not found.</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'FAILED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'OUT_FOR_DELIVERY':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      default:
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders List</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">Order #{order.id}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>

          {order.status === 'FAILED' && (
            <button
              onClick={() => setShowReschedule(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
            >
              Reschedule Delivery Attempt
            </button>
          )}
        </div>

        {/* Map */}
        <TrackingMap
          pickupLocation={{ lat: 37.7749, lng: -122.4194 }}
          dropLocation={{ lat: 37.7833, lng: -122.4167 }}
          agentLocation={agentLocation}
        />

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase">Pickup Location</span>
            <p className="text-white font-medium">{order.pickupAddress}</p>
            <span className="text-slate-500 block">Pincode: {order.pickupPincode}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase">Drop Location</span>
            <p className="text-white font-medium">{order.dropAddress}</p>
            <span className="text-slate-500 block">Pincode: {order.dropPincode}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase">Assigned Agent</span>
            <p className="text-white font-medium">{order.assignedAgent ? order.assignedAgent.name : 'Searching nearest agent...'}</p>
            <span className="text-slate-500 block">{order.assignedAgent?.phone || 'N/A'}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Immutable Tracking Timeline</span>
          </h3>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {order.trackingHistory?.map((item, idx) => (
              <div key={item.id} className="flex items-start space-x-4 relative z-10">
                <div className="w-7 h-7 rounded-full bg-slate-950 border border-sky-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-sky-400" />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.status}</span>
                    <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{item.notes}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">Actor: {item.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal
          orderId={order.id}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}
    </div>
  );
}
