import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, removeToast } = useNotification();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center justify-between p-4 rounded-xl shadow-xl backdrop-blur-md border ${
            n.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : n.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-sky-950/80 border-sky-500/50 text-sky-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {n.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : n.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{n.message}</span>
          </div>

          <button
            onClick={() => removeToast(n.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
