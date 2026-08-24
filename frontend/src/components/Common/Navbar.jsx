import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Truck, LogOut, User, DollarSign, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { currencyCode, changeCurrency, currencies } = useCurrency();

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-wide block leading-none">LAST-MILE</span>
            <span className="text-xs text-sky-400 font-semibold tracking-wider">LOGISTICS TRACKER</span>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          {/* Currency Selector */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-sky-400 mr-1.5 shrink-0" />
            <select
              value={currencyCode}
              onChange={(e) => changeCurrency(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <User className="w-4 h-4 text-sky-400" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">{user.name}</span>
                  <span className="text-sky-400 font-medium capitalize">{user.role}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center space-x-1"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
