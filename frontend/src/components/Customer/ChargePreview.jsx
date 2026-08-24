import React from 'react';
import { Calculator, ShieldAlert, CheckCircle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function ChargePreview({ previewData }) {
  const { formatPrice, currency } = useCurrency();

  if (!previewData) return null;

  const {
    volumetricWeight,
    billableWeight,
    baseCharge,
    weightCharge,
    codSurcharge,
    totalCharge,
    isIntraZone,
    pickupZone,
    dropZone
  } = previewData;

  const perKgConverted = weightCharge && billableWeight ? weightCharge / billableWeight : 0;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-white text-base">Rate Calculation Breakdown ({currency.code})</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
          {isIntraZone ? 'Intra-Zone (Same Area)' : 'Inter-Zone (Cross Area)'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Volumetric Weight</span>
          <span className="text-white font-bold text-sm">{volumetricWeight} kg</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">(L×W×H ÷ 5000)</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Billable Weight</span>
          <span className="text-sky-400 font-bold text-sm">{billableWeight} kg</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">max(Actual, Volumetric)</span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
        <div className="flex justify-between">
          <span>Base Charge ({isIntraZone ? 'Intra' : 'Inter'})</span>
          <span className="font-semibold text-white">{formatPrice(baseCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Weight Charge ({formatPrice(perKgConverted)}/kg)</span>
          <span className="font-semibold text-white">{formatPrice(weightCharge)}</span>
        </div>
        {codSurcharge > 0 && (
          <div className="flex justify-between text-amber-400">
            <span>COD Surcharge</span>
            <span className="font-semibold">+{formatPrice(codSurcharge)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-slate-800 text-sm font-bold text-white">
          <span>Total Delivery Charge</span>
          <span className="text-sky-400 text-lg">{formatPrice(totalCharge)}</span>
        </div>
      </div>
    </div>
  );
}
