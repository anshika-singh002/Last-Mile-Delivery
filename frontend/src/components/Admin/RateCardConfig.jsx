import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { useCurrency } from '../../context/CurrencyContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { CreditCard, Save } from 'lucide-react';

export default function RateCardConfig() {
  const { addToast } = useNotification();
  const { currency } = useCurrency();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCard, setNewCard] = useState({
    orderType: 'B2B',
    isIntraZone: true,
    baseRate: '',
    perKgRate: '',
    codSurchargeRate: ''
  });

  const fetchRateCards = async () => {
    try {
      const res = await adminService.getRateCards();
      if (res.success) {
        setCards(Array.isArray(res.data) ? res.data : []);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error(err);
      setCards([]);
      addToast('Failed to load rate cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCards();
  }, []);

  const handleUpdateRate = async (id, updatedData) => {
    try {
      const res = await adminService.updateRateCard(id, updatedData);
      if (res.success) {
        addToast('Rate card updated successfully!', 'success');
        fetchRateCards();
      } else {
        addToast('Failed to update rate card', 'error');
      }
    } catch (err) {
      addToast('Failed to update rate card', 'error');
    }
  };

  const handleCreateRateCard = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        orderType: newCard.orderType,
        isIntraZone: newCard.isIntraZone,
        baseRate: Number(newCard.baseRate),
        perKgRate: Number(newCard.perKgRate),
        codSurchargeRate: Number(newCard.codSurchargeRate)
      };

      const res = await adminService.createRateCard(payload);
      if (res.success) {
        addToast('Rate card saved successfully!', 'success');
        setNewCard({
          orderType: 'B2B',
          isIntraZone: true,
          baseRate: '',
          perKgRate: '',
          codSurchargeRate: ''
        });
        fetchRateCards();
      } else {
        addToast('Failed to save rate card', 'error');
      }
    } catch (err) {
      addToast('Failed to save rate card', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Fetching rate card matrix..." />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Rate Card Configuration Engine</h2>
        <p className="text-xs text-slate-400">
          Configure base rates, per-kg pricing, and COD surcharges dynamically ({currency.code})
        </p>
      </div>

      <form onSubmit={handleCreateRateCard} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <select
            value={newCard.orderType}
            onChange={(e) => setNewCard({ ...newCard, orderType: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
          >
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>

          <select
            value={newCard.isIntraZone ? 'intra' : 'inter'}
            onChange={(e) => setNewCard({ ...newCard, isIntraZone: e.target.value === 'intra' })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
          >
            <option value="intra">Intra-Zone</option>
            <option value="inter">Inter-Zone</option>
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Base rate"
            value={newCard.baseRate}
            onChange={(e) => setNewCard({ ...newCard, baseRate: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Per-kg rate"
            value={newCard.perKgRate}
            onChange={(e) => setNewCard({ ...newCard, perKgRate: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <input
            type="number"
            step="0.01"
            placeholder="COD surcharge"
            value={newCard.codSurchargeRate}
            onChange={(e) => setNewCard({ ...newCard, codSurchargeRate: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
          />

          <button
            type="submit"
            disabled={creating}
            className="py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-semibold rounded-lg"
          >
            {creating ? 'Saving...' : 'Save / Update Card'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <RateCardItem key={card.id} card={card} onSave={handleUpdateRate} currencySymbol={currency.symbol} />
        ))}
      </div>
    </div>
  );
}

function RateCardItem({ card, onSave, currencySymbol }) {
  const [baseRate, setBaseRate] = useState(card.baseRate);
  const [perKgRate, setPerKgRate] = useState(card.perKgRate);
  const [codSurchargeRate, setCodSurchargeRate] = useState(card.codSurchargeRate);

  return (
    <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-sky-400" />
          <span className="font-bold text-white text-sm">{card.orderType} Rate Matrix</span>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {card.isIntraZone ? 'Intra-Zone' : 'Inter-Zone'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Base Rate ({currencySymbol})</label>
          <input
            type="number"
            step="0.5"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Per-Kg Rate ({currencySymbol})</label>
          <input
            type="number"
            step="0.1"
            value={perKgRate}
            onChange={(e) => setPerKgRate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">COD Surcharge ({currencySymbol})</label>
          <input
            type="number"
            step="0.5"
            value={codSurchargeRate}
            onChange={(e) => setCodSurchargeRate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <button
        onClick={() => onSave(card.id, { baseRate, perKgRate, codSurchargeRate })}
        className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-sky-400 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-2"
      >
        <Save className="w-4 h-4" />
        <span>Save Rate Card</span>
      </button>
    </div>
  );
}