import React from 'react';
import { InventoryLog } from '../types.ts';
import { 
  History, 
  MinusCircle, 
  PlusCircle, 
  ShoppingCart, 
  Sliders, 
  User, 
  Calendar 
} from 'lucide-react';

interface AuditLogsProps {
  logs: InventoryLog[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'consumed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
            <MinusCircle className="h-3 w-3" /> Used
          </span>
        );
      case 'restocked':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <PlusCircle className="h-3 w-3" /> Restocked
          </span>
        );
      case 'reordered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <ShoppingCart className="h-3 w-3" /> Ordered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Sliders className="h-3 w-3" /> Changed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Activity History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          List of all parts used, added, or ordered.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500 sm:hidden dark:border-slate-800 dark:bg-slate-800/40">
          <span>Scroll horizontally to view all columns</span>
          <span className="text-slate-400">&rarr;</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Part</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">{getTypeBadge(log.type)}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{log.partName}</span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{log.partNumber}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                    {log.type === 'consumed' ? (
                      <span className="text-rose-600">-{log.quantity}</span>
                    ) : (
                      <span className="text-emerald-600">+{log.quantity}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.performedBy}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
