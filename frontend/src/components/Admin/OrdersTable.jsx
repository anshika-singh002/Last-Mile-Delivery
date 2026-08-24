import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { orderService } from '../../services/orderService';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function OrdersTable() {
  const { formatPrice } = useCurrency();
  const { addToast } = useNotification();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const fetchData = async () => {
    try {
      const [ordRes, agRes] = await Promise.all([
        orderService.getOrders(),
        adminService.getAgents()
      ]);

      const normalizedOrders = Array.isArray(ordRes?.data)
        ? ordRes.data
        : Array.isArray(ordRes?.orders)
          ? ordRes.orders
          : [];

      const normalizedAgents = Array.isArray(agRes?.data)
        ? agRes.data
        : Array.isArray(agRes?.agents)
          ? agRes.agents
          : [];

      setOrders(normalizedOrders);
      setAgents(normalizedAgents);
    } catch (err) {
      console.error('Failed to fetch admin order data:', err);
      setOrders([]);
      setAgents([]);
      addToast('Unable to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignAgent = async (orderId, agentId) => {
    if (!agentId) return;

    try {
      const res = await orderService.assignAgent(orderId, agentId);
      if (res?.success) {
        addToast(`Agent assigned to Order #${orderId}`, 'success');
        fetchData();
      } else {
        addToast(res?.message || 'Failed to assign agent', 'error');
      }
    } catch (err) {
      addToast('Failed to assign agent', 'error');
    }
  };

  const handleOverrideStatus = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateStatus(orderId, {
        status: newStatus,
        notes: `Admin overridden status to ${newStatus}`
      });

      if (res?.success) {
        addToast(`Order #${orderId} status overridden to ${newStatus}`, 'success');
        fetchData();
      } else {
        addToast(res?.message || 'Failed to override status', 'error');
      }
    } catch (err) {
      addToast('Failed to override status', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Fetching orders matrix..." />;

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter((o) => {
    if (statusFilter && o?.status !== statusFilter) return false;
    if (agentFilter && o?.assignedAgentId !== agentFilter) return false;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">All Deliveries Management</h2>
          <p className="text-xs text-slate-400">Filter by status/agent, manual assignment & admin overrides</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="PICKED_UP">PICKED_UP</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Agents</option>
            {agents.map((ag) => (
              <option key={ag.id || ag._id} value={ag.id || ag._id}>{ag.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!safeOrders.length ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">
          No orders available yet.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">
          No orders match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Pincodes</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Charge</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Agent</th>
                <th className="px-4 py-3 rounded-r-xl">Override Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((order) => (
                <tr key={order.id || order._id} className="hover:bg-slate-950/40 transition">
                  <td className="px-4 py-3.5 font-bold text-white">#{order.id || order._id || 'N/A'}</td>
                  <td className="px-4 py-3.5">{order.customerName || 'N/A'}</td>
                  <td className="px-4 py-3.5">
                    {order.pickupPincode || order.pickup?.pincode || 'N/A'} → {order.dropPincode || order.drop?.pincode || 'N/A'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-bold">
                      {order.orderType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white">
                    {formatPrice(order.totalCharge ?? order.amount ?? 0)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full font-bold border text-[10px] ${
                      order.status === 'DELIVERED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      order.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    }`}>
                      {order.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={order.assignedAgentId || order.assignedAgent || ''}
                      onChange={(e) => handleAssignAgent(order.id || order._id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((ag) => (
                        <option key={ag.id || ag._id} value={ag.id || ag._id}>{ag.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      onChange={(e) => e.target.value && handleOverrideStatus(order.id || order._id, e.target.value)}
                      defaultValue=""
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>Override Status...</option>
                      <option value="CREATED">CREATED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="PICKED_UP">PICKED_UP</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}