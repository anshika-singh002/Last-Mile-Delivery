import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useCurrency } from '../../context/CurrencyContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { LayoutDashboard, Package, Truck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { formatPrice, currency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAnalytics();
      if (res?.success && res?.data) {
        setStats(res.data);
      } else {
        setStats(null);
        setError(res?.message || 'Unable to retrieve logistics analytics');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to analytics service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Calculating logistics analytics..." />;

  if (error || !stats) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-white">Analytics Unavailable</h3>
          <p className="text-xs text-slate-400 mt-1">{error || 'Could not load analytics metrics.'}</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Analytics</span>
        </button>
      </div>
    );
  }

  const safeStats = {
    totalRevenue: stats.totalRevenue ?? 0,
    totalOrders: stats.totalOrders ?? 0,
    delivered: stats.delivered ?? 0,
    failed: stats.failed ?? 0,
    active: stats.active ?? 0,
    totalAgents: stats.totalAgents ?? 0,
    availableAgents: stats.availableAgents ?? 0,
    zonesCount: stats.zonesCount ?? 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="w-6 h-6 text-sky-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Logistics Control Center</h2>
            <p className="text-xs text-slate-400">Live operational throughput and fleet availability</p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Refresh statistics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center">
              {currency?.symbol || '$'}
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white">{formatPrice(safeStats.totalRevenue)}</p>
          <span className="text-[10px] text-slate-500 block">Converted to {currency?.code || 'USD'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <Package className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{safeStats.totalOrders}</p>
          <div className="flex space-x-3 text-[10px] text-slate-400">
            <span>Active: <strong className="text-sky-400">{safeStats.active}</strong></span>
            <span>Delivered: <strong className="text-emerald-400">{safeStats.delivered}</strong></span>
            <span>Failed: <strong className="text-rose-400">{safeStats.failed}</strong></span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivery Agents</span>
            <Truck className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{safeStats.totalAgents}</p>
          <span className="text-[10px] text-slate-400 block">
            Available right now: <strong className="text-sky-400">{safeStats.availableAgents}</strong>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Zones</span>
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{safeStats.zonesCount}</p>
          <span className="text-[10px] text-slate-500 block">Intra/Inter coverage</span>
        </div>
      </div>
    </div>
  );
}
