import React from 'react';
import { DashboardStats, InventoryAlert, InventoryLog, SparePart } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Boxes, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  ShoppingCart
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats | null;
  alerts: InventoryAlert[];
  logs: InventoryLog[];
  parts: SparePart[];
  onNavigateToCatalog: () => void;
  onNavigateToReorders: () => void;
  onNavigateToAlerts: () => void;
  onResolveAlert: (id: string) => void;
  onReorderPart: (part: SparePart) => void;
}

const STATUS_COLORS: Record<string, string> = {
  in_stock: '#10b981', // emerald
  low_stock: '#f59e0b', // amber
  critical: '#ef4444', // rose
  reorder_placed: '#3b82f6', // blue
};

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  alerts,
  logs,
  parts,
  onNavigateToCatalog,
  onNavigateToReorders,
  onNavigateToAlerts,
  onResolveAlert,
  onReorderPart
}) => {
  const { permissions } = useAuth();
  const activeAlerts = alerts.filter(a => !a.isResolved);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Find parts requiring attention (stock below or equal to minimum threshold)
  const reorderUrgentParts = parts.filter(p => p.stockLeft <= p.minThreshold).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Inventory Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Overview of items, stock levels, and threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToReorders}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Low Stock Items ({reorderUrgentParts.length})</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Total Parts SKU */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Items</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalParts}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Catalog items
          </p>
        </div>

        {/* 2. In-Stock Units */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock Left</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.totalStockLeft}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Available units
          </p>
        </div>

        {/* 3. Total Consumed Units */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Parts Used</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalConsumed}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Used in robot repairs
          </p>
        </div>

        {/* 4. Critical & Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low Stock Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {stats.criticalCount + stats.lowStockCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.criticalCount} empty / {stats.lowStockCount} low
          </p>
        </div>

        {/* 5. Inventory Valuation */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Stock Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            ₹{stats.totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.pendingOrdersCount} orders placed
          </p>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bar Chart: Stock Left vs Consumed by Category */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Stock Left vs Consumed by Category
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Comparison of active inventory vs replacement consumption volume
              </p>
            </div>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.categoryDistribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none'
                  }} 
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="stock" name="Stock Left" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumed" name="Units Consumed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Inventory Health Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Inventory Health Status
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proportion of SKUs requiring urgent replenishment
            </p>
          </div>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status] || '#94a3b8'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [val, String(name).replace('_', ' ').toUpperCase()]}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            {stats.statusDistribution.map(s => (
              <div key={s.status} className="flex items-center gap-1.5">
                <span 
                  className="h-2.5 w-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[s.status] || '#94a3b8' }} 
                />
                <span className="text-slate-600 dark:text-slate-300 capitalize truncate">
                  {s.status.replace('_', ' ')}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consumption Trend & Spend Curve */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend Area Chart */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Historical Consumption & Replacement Spend
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly trajectory of robot replacement components and maintenance expenditure
              </p>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.monthlyConsumption}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val, name) => [
                    name === 'cost' ? `₹${Number(val).toLocaleString('en-IN')}` : `${val} units`,
                    name === 'cost' ? 'Total Cost (₹)' : 'Parts Used'
                  ]}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="units" name="Parts Used" stroke="#6366f1" fillOpacity={1} fill="url(#colorUnits)" />
                <Area type="monotone" dataKey="cost" name="Spend (₹)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Active Alerts Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active System Alerts ({activeAlerts.length})
              </h2>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View All
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                All items are within safe operational limits.
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alt) => (
                <div key={alt.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${alt.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {alt.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {alt.message}
                      </p>
                    </div>
                  </div>
                  {permissions.canResolveAlerts && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onResolveAlert(alt.id)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Acknowledge & Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actionable Reorder Pipeline Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Critical Reorder Pipeline
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Items currently below threshold where reorders are recommended
            </p>
          </div>
          <button
            onClick={onNavigateToReorders}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <span>Full Reorder Center</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] text-slate-500 sm:hidden dark:border-slate-800 dark:bg-slate-800/40">
            <span>Scroll horizontally to view details</span>
            <span className="text-slate-400">&rarr;</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-2">Location</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2 text-center">Stock Left</th>
                <th className="py-2.5 px-2 text-center">Min Threshold</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reorderUrgentParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{part.name}</span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{part.partNumber}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {part.location || 'General Storage'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 text-xs">
                    {part.category || 'General'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-rose-600">
                    {part.stockLeft}
                  </td>
                  <td className="py-2.5 px-2 text-center font-medium text-slate-500">
                    {part.minThreshold}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-white">
                    ₹{part.unitCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {permissions.canReorder ? (
                      <button
                        onClick={() => onReorderPart(part)}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                      >
                        Reorder
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Read Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};
