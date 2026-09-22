import React, { useMemo } from 'react';
import { DashboardStats, InventoryAlert, InventoryLog, SparePart } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { localStore } from '../lib/localStore.ts';
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
  onNavigateToStockDetail?: (partId?: string) => void;
  onNavigateToReorders: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToLogs?: () => void;
  onResolveAlert: (id: string) => void;
  onReorderPart: (part: SparePart) => void;
}

const STATUS_COLORS: Record<string, string> = {
  in_stock: '#10b981', // emerald
  low_stock: '#f59e0b', // amber
  critical: '#ef4444', // rose
  reorder_placed: '#3b82f6', // blue
};

const CustomConsumptionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const unitsItem = payload.find((p: any) => p.dataKey === 'units');
    const costItem = payload.find((p: any) => p.dataKey === 'cost');

    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-xs min-w-[170px]">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">{label}</p>
        <div className="space-y-1.5">
          {unitsItem && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Parts Used:</span>
              </div>
              <span className="font-semibold text-indigo-400">
                {unitsItem.value} units
              </span>
            </div>
          )}
          {costItem && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-slate-300">Spend:</span>
              </div>
              <span className="font-semibold text-sky-400">
                ₹{Number(costItem.value).toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  alerts,
  logs,
  parts,
  onNavigateToCatalog,
  onNavigateToStockDetail,
  onNavigateToReorders,
  onNavigateToAlerts,
  onNavigateToLogs,
  onResolveAlert,
  onReorderPart
}) => {
  const { permissions } = useAuth();
  const activeAlerts = alerts.filter(a => !a.isResolved);

  // Fallback to localStore stats if stats are loading or not yet provided, preventing infinite loading hang
  const activeStats = useMemo(() => {
    if (stats) return stats;
    return localStore.getDashboardStats();
  }, [stats]);
  const statsData = stats || activeStats;

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

      {/* Top Metric Cards - Interactive with Page Redirection */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Total Parts SKU -> redirects to Catalog */}
        <button
          type="button"
          onClick={onNavigateToCatalog}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          title="Click to view all items in Catalog"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition-colors">
              Total Items
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-500 dark:group-hover:text-white transition-colors">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {statsData.totalParts}
          </p>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Catalog items</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all dark:text-slate-600" />
          </div>
        </button>

        {/* 2. In-Stock Units -> redirects to Stock Detail */}
        <button
          type="button"
          onClick={() => (onNavigateToStockDetail ? onNavigateToStockDetail() : onNavigateToCatalog())}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          title="Click to view Stock Details & Movement"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400 transition-colors">
              Stock Left
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {statsData.totalStockLeft}
          </p>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Available units</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all dark:text-slate-600" />
          </div>
        </button>

        {/* 3. Total Consumed Units -> redirects to Logs */}
        <button
          type="button"
          onClick={() => (onNavigateToLogs ? onNavigateToLogs() : onNavigateToCatalog())}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          title="Click to view Usage History & Logs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 transition-colors">
              Parts Used
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white transition-colors">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {statsData.totalConsumed}
          </p>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Used in robot repairs</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all dark:text-slate-600" />
          </div>
        </button>

        {/* 4. Critical & Low Stock Alerts -> redirects to Alerts */}
        <button
          type="button"
          onClick={onNavigateToAlerts}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-700 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          title="Click to view Alerts Center"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400 transition-colors">
              Low Stock Alerts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white dark:bg-rose-950/60 dark:text-rose-400 dark:group-hover:bg-rose-500 dark:group-hover:text-white transition-colors">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {statsData.criticalCount + statsData.lowStockCount}
          </p>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{statsData.criticalCount} empty / {statsData.lowStockCount} low</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all dark:text-slate-600" />
          </div>
        </button>

        {/* 5. Inventory Valuation -> redirects to Reorders */}
        <button
          type="button"
          onClick={onNavigateToReorders}
          className="col-span-2 sm:col-span-1 text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          title="Click to view Orders & Reorder Center"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 dark:text-slate-400 dark:group-hover:text-amber-400 transition-colors">
              Total Stock Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/60 dark:text-amber-400 dark:group-hover:bg-amber-500 dark:group-hover:text-white transition-colors">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            ₹{statsData.totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{statsData.pendingOrdersCount} orders placed</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all dark:text-slate-600" />
          </div>
        </button>
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
            <button
              onClick={onNavigateToCatalog}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
              title="Click to view all items in Catalog"
            >
              <span>View Catalog</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statsData.categoryDistribution}
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
                  formatter={(val: any, name: any) => [
                    `${val} units`, 
                    name === 'stock' || name === 'Stock Left' ? 'Stock Left' : 'Units Consumed'
                  ]}
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Inventory Health Status
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Proportion of SKUs requiring replenishment
              </p>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400 cursor-pointer"
              title="Click to view alerts"
            >
              <span>Alerts</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {statsData.statusDistribution.map((entry, index) => (
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
            {statsData.statusDistribution.map(s => (
              <div 
                key={s.status} 
                onClick={s.status === 'in_stock' ? onNavigateToCatalog : onNavigateToAlerts}
                className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                title={`Click to view ${s.status.replace('_', ' ')} items`}
              >
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
        {/* Monthly Trend Area Chart with Dual Y-Axes and Fixed Tooltip */}
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
            <button
              onClick={() => (onNavigateToLogs ? onNavigateToLogs() : onNavigateToCatalog())}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
              title="Click to view full usage audit logs"
            >
              <span>View Usage Logs</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={statsData.monthlyConsumption}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
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
                {/* Left Y-Axis for Spend (₹) */}
                <YAxis 
                  yAxisId="cost"
                  orientation="left"
                  tick={{ fontSize: 10, fill: '#0ea5e9' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                {/* Right Y-Axis for Parts Used (units) */}
                <YAxis 
                  yAxisId="units"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#6366f1' }}
                  tickFormatter={(v) => `${v}u`}
                />
                <Tooltip content={<CustomConsumptionTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area 
                  yAxisId="cost"
                  type="monotone" 
                  dataKey="cost" 
                  name="Spend (₹)" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
                <Area 
                  yAxisId="units"
                  type="monotone" 
                  dataKey="units" 
                  name="Parts Used" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorUnits)" 
                />
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
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
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
                <div 
                  key={alt.id} 
                  onClick={onNavigateToAlerts}
                  className="py-2.5 cursor-pointer rounded-lg px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  title="Click to view in Alerts Center"
                >
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
                    <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onResolveAlert(alt.id)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
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
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
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
                  <td 
                    className="py-2.5 px-3 cursor-pointer group"
                    onClick={() => (onNavigateToStockDetail ? onNavigateToStockDetail(part.id) : onNavigateToCatalog())}
                    title="Click to view item stock details"
                  >
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 block transition-colors">
                      {part.name}
                    </span>
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
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 cursor-pointer"
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
