import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Truck, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        addToast('Welcome back!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed. Check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Dashboard</h2>
          <p className="text-sm text-slate-400">Manage orders, agent assignments & live tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@demo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-sky-500/20 transition duration-200"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('customer@demo.com')}
              className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              Customer
            </button>
            <button
              onClick={() => handleQuickLogin('agent1@demo.com')}
              className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              Agent
            </button>
            <button
              onClick={() => handleQuickLogin('admin@demo.com')}
              className="px-2 py-1.5 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
