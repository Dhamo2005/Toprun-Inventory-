import React, { useState } from 'react';
import { InventoryAlert } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  BellRing, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  CheckCheck, 
  Calendar,
  Filter,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AlertsCenterProps {
  alerts: InventoryAlert[];
  onResolveAlert: (id: string) => Promise<void>;
  onRefresh: () => void;
  onSelectPartId?: (partId: string) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  onResolveAlert,
  onRefresh,
  onSelectPartId
}) => {
  const { permissions } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return !a.isResolved;
    if (filter === 'resolved') return a.isResolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Stock Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Notifications when parts run out or fall below minimum stock levels.
          </p>
        </div>

        {/* Filter Tabs & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh alerts from database"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync with DB</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setFilter('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'active'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Active ({alerts.filter(a => !a.isResolved).length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'resolved'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Resolved ({alerts.filter(a => a.isResolved).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No alerts in this view</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              All items inventory triggers are currently healthy.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                alt.isResolved
                  ? 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-900/40'
                  : alt.severity === 'critical'
                  ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20'
                  : 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  alt.isResolved
                    ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : alt.severity === 'critical'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                }`}>
                  {alt.isResolved ? (
                    <CheckCheck className="h-5 w-5" />
                  ) : alt.severity === 'critical' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {alt.title}
                    </span>
                    <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      [{alt.partNumber}]
                    </span>
                    <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold uppercase ${
                      alt.isResolved
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        : alt.severity === 'critical'
                        ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}>
                      {alt.isResolved ? 'Resolved' : alt.severity}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {alt.message}
                  </p>

                  <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(alt.createdAt).toLocaleString()}</span>
                    </div>
                    <span>Part: {alt.partName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                {onSelectPartId && alt.partId && (
                  <button
                    onClick={() => onSelectPartId(alt.partId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    <span>Inspect Part</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {!alt.isResolved && permissions.canResolveAlerts && (
                  <button
                    onClick={() => onResolveAlert(alt.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Mark as Resolved</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
