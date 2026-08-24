import React, { useState } from 'react';
import Dashboard from '../components/Admin/Dashboard';
import ZoneManagement from '../components/Admin/ZoneManagement';
import RateCardConfig from '../components/Admin/RateCardConfig';
import OrdersTable from '../components/Admin/OrdersTable';
import CreateOrder from '../components/Customer/CreateOrder';
import { LayoutDashboard, MapPin, CreditCard, Package, PlusCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Admin Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 max-w-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'dashboard'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>All Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'zones'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Zone Config</span>
        </button>

        <button
          onClick={() => setActiveTab('rateCards')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'rateCards'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rate Cards</span>
        </button>

        <button
          onClick={() => setActiveTab('createOrder')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'createOrder'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Order (Admin)</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'orders' && <OrdersTable />}
      {activeTab === 'zones' && <ZoneManagement />}
      {activeTab === 'rateCards' && <RateCardConfig />}
      {activeTab === 'createOrder' && (
        <CreateOrder onOrderCreated={() => setActiveTab('orders')} />
      )}
    </div>
  );
}
