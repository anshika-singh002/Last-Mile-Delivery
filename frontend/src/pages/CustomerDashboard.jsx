import React, { useState } from 'react';
import CreateOrder from '../components/Customer/CreateOrder';
import OrderList from '../components/Customer/OrderList';
import OrderTracking from '../components/Customer/OrderTracking';
import { PackagePlus, ListFilter, MapPin } from 'lucide-react';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'tracking'
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('tracking');
  };

  const handleOrderCreated = (order) => {
    setSelectedOrderId(order.id);
    setActiveTab('tracking');
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2 max-w-md">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'list'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>My Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'create'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Create Order</span>
        </button>

        {selectedOrderId && (
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'tracking'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Live Tracking</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'list' && <OrderList onSelectOrder={handleSelectOrder} />}
      {activeTab === 'create' && <CreateOrder onOrderCreated={handleOrderCreated} />}
      {activeTab === 'tracking' && selectedOrderId && (
        <OrderTracking orderId={selectedOrderId} onBack={() => setActiveTab('list')} />
      )}
    </div>
  );
}
