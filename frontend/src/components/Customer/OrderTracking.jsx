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

        {/* Failed Delivery Action Banner */}
        {order.status === 'FAILED' && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Delivery Attempt Unsuccessful</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  The delivery partner was unable to complete the drop-off. Please select a new convenient date and delivery instructions to reassign an agent.
                </p>
                {order.rescheduleDate && (
                  <p className="text-[11px] text-amber-300 font-semibold">
                    Last Rescheduled Date: {order.rescheduleDate}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowReschedule(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition whitespace-nowrap self-start md:self-auto flex items-center space-x-2"
            >
              <span>Reschedule Delivery Now</span>
            </button>
          </div>
        )}

        {/* Rescheduled Confirmation Banner */}
        {order.rescheduleDate && order.status === 'ASSIGNED' && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex items-center space-x-3 text-xs">
            <CheckCircle className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-white font-bold block">Delivery Rescheduled for {order.rescheduleDate}</span>
              <span className="text-slate-400">
                Auto-assigned to {order.assignedAgent?.name || 'delivery agent'}. Reason: {order.rescheduleReason || 'Customer requested'}
              </span>
            </div>
          </div>
        )}

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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Immutable Lifecycle Audit Ledger</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SHA-256 Verified Ledger</span>
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {order.trackingHistory?.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 relative z-10">
                <div className="w-7 h-7 rounded-full bg-slate-950 border border-sky-500 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                  <CheckCircle className="w-4 h-4 text-sky-400" />
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{item.status}</span>
                      {item.previousStatus && (
                        <span className="text-[10px] text-slate-500">
                          (from {item.previousStatus})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs">{item.notes}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400 font-semibold">Actor:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                        {item.actorName ? `${item.actorName} (${item.actor})` : item.actor}
                      </span>
                    </div>

                    {item.eventHash && (
                      <span className="font-mono text-[9px] text-slate-600 truncate max-w-[200px]" title={`Cryptographic Event Checksum: ${item.eventHash}`}>
                        Hash: {item.eventHash.slice(0, 12)}...
                      </span>
                    )}
                  </div>
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
