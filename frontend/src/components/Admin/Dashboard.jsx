import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useCurrency } from '../../context/CurrencyContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { LayoutDashboard, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { formatPrice, currency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getAnalytics();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Calculating analytics..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <LayoutDashboard className="w-6 h-6 text-sky-400" />
        <h2 className="text-xl font-bold text-white">Logistics Control Center</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center">
              {currency.symbol}
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white">{formatPrice(stats.totalRevenue)}</p>
          <span className="text-[10px] text-slate-500 block">Converted to {currency.code}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <Package className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalOrders}</p>
          <div className="flex space-x-3 text-[10px] text-slate-400">
            <span>Delivered: <strong className="text-emerald-400">{stats.delivered}</strong></span>
            <span>Failed: <strong className="text-rose-400">{stats.failed}</strong></span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivery Agents</span>
            <Truck className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalAgents}</p>
          <span className="text-[10px] text-slate-400 block">
            Available right now: <strong className="text-sky-400">{stats.availableAgents}</strong>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Zones</span>
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.zonesCount}</p>
          <span className="text-[10px] text-slate-500 block">Intra/Inter coverage</span>
        </div>
      </div>
    </div>
  );
}
