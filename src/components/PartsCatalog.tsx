import React, { useState, useMemo } from 'react';
import { SparePart, PartCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PartImage } from './PartImage.tsx';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  MinusCircle, 
  PlusCircle, 
  ShoppingCart, 
  MoreVertical, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  Cpu,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

interface PartsCatalogProps {
  parts: SparePart[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPart: (part: SparePart) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (part: SparePart) => void;
  onOpenConsumeModal: (part: SparePart) => void;
  onOpenRestockModal: (part: SparePart) => void;
  onOpenReorderModal: (part: SparePart) => void;
  onDeletePart: (part: SparePart) => void;
}

export const PartsCatalog: React.FC<PartsCatalogProps> = ({
  parts,
  isLoading,
  onRefresh,
  onSelectPart,
  onOpenAddModal,
  onOpenEditModal,
  onOpenConsumeModal,
  onOpenRestockModal,
  onOpenReorderModal,
  onDeletePart,
}) => {
  const { permissions, role } = useAuth();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyNeedOrder, setOnlyNeedOrder] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'stockLeft' | 'minThreshold' | 'name' | 'unitCost'>('stockLeft');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Available unique categories & locations from current parts
  const categories = useMemo(() => {
    const set = new Set(parts.map(p => p.category).filter(Boolean));
    return Array.from(set);
  }, [parts]);

  const locations = useMemo(() => {
    const set = new Set(parts.map(p => p.location).filter(Boolean));
    return Array.from(set);
  }, [parts]);

  // Filtered and sorted parts
  const filteredParts = useMemo(() => {
    return parts
      .filter(p => {
        if (search) {
          const s = search.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(s) ||
            p.partNumber.toLowerCase().includes(s) ||
            (p.description && p.description.toLowerCase().includes(s)) ||
            (p.location && p.location.toLowerCase().includes(s)) ||
            (p.category && p.category.toLowerCase().includes(s));
          if (!matches) return false;
        }

        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        if (selectedLocation !== 'all' && p.location !== selectedLocation) {
          return false;
        }

        if (statusFilter !== 'all' && p.status !== statusFilter) {
          return false;
        }

        if (onlyNeedOrder && p.stockLeft > p.minThreshold) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [parts, search, selectedCategory, selectedLocation, statusFilter, onlyNeedOrder, sortBy, sortOrder]);

  const statusBadge = (status: string, stock: number, minThreshold: number) => {
    switch (status) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
            <AlertTriangle className="h-3 w-3" />
            {stock === 0 ? 'Depleted (0)' : 'Critical Low'}
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </span>
        );
      case 'reorder_placed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
            <Clock className="h-3 w-3" />
            PO Placed
          </span>
        );
      case 'in_stock':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            In Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Inventory Items
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            View all items, current stock levels, and replenishment status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-parts-btn"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {permissions.canEditPart && (
            <button
              id="add-new-part-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Comprehensive Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="search-parts-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part name, SKU, robot model, location..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            >
              <option value="all">All Component Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <select
              id="filter-location-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            >
              <option value="all">All Storage Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            >
              <option value="stockLeft">Sort: Stock Left</option>
              <option value="minThreshold">Sort: Min Threshold</option>
              <option value="unitCost">Sort: Unit Price</option>
              <option value="name">Sort: Item Name</option>
            </select>
            <button
              id="sort-order-toggle"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Toggle sort order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Badges & View Mode Selector */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Parts', count: parts.length },
              { id: 'in_stock', label: 'In Stock', count: parts.filter(p => p.status === 'in_stock').length },
              { id: 'low_stock', label: 'Low Stock', count: parts.filter(p => p.status === 'low_stock').length },
              { id: 'critical', label: 'Critical / 0 Stock', count: parts.filter(p => p.status === 'critical').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label} <span className="text-[10px] opacity-70">({tab.count})</span>
              </button>
            ))}

            <label className="ml-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNeedOrder}
                onChange={(e) => setOnlyNeedOrder(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span>Items Needing Order Only</span>
            </label>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Dense Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredParts.length}</span> of{' '}
          {parts.length} total items
        </p>
      </div>

      {/* Grid Card View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredParts.map((part) => {
            const stockPercent = Math.min(100, Math.round((part.stockLeft / (part.minThreshold * 2)) * 100));
            const isNeedOrder = part.stockLeft <= part.minThreshold;

            return (
              <div
                key={part.id}
                id={`part-card-${part.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
              >
                <div>
                  {/* Card Image & Status Overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <PartImage
                      src={part.imageUrl}
                      alt={part.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      {statusBadge(part.status, part.stockLeft, part.minThreshold)}
                    </div>
                    <div className="absolute top-2.5 right-2.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      ₹{part.unitCost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Item Number & Category Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {part.partNumber}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {part.category || 'General'}
                      </span>
                    </div>

                    <h3 
                      onClick={() => onSelectPart(part)}
                      className="mt-1.5 text-sm font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer dark:text-white dark:hover:text-indigo-400"
                    >
                      {part.name}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 dark:text-slate-400 min-h-[32px]">
                      {part.description || 'No description provided.'}
                    </p>

                    {/* Stock Metrics Visual Breakdown: Stock Left & Min Threshold */}
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="grid grid-cols-2 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-700">
                        {/* 1. Left in Stock */}
                        <div className="px-1">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Stock Left
                          </p>
                          <p className={`text-base font-extrabold ${part.stockLeft === 0 ? 'text-rose-600' : part.stockLeft <= part.minThreshold ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {part.stockLeft}
                          </p>
                        </div>

                        {/* 2. Minimum Threshold */}
                        <div className="px-1">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Min Threshold
                          </p>
                          <p className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                            {part.minThreshold}
                          </p>
                        </div>
                      </div>

                      {/* Stock Level Visual Bar */}
                      <div className="mt-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full transition-all duration-300 ${
                              part.stockLeft === 0
                                ? 'w-0'
                                : part.stockLeft <= part.minThreshold
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(part.stockLeft > 0 ? 8 : 0, stockPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location chip */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[170px] font-medium text-slate-700 dark:text-slate-300">
                          {part.location || 'Unassigned Location'}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        ₹{(part.stockLeft * part.unitCost).toLocaleString('en-IN')} total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls based on RBAC */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Consume / Use button (Tech, Manager, Admin) */}
                    {permissions.canConsume ? (
                      <button
                        id={`consume-btn-${part.id}`}
                        onClick={() => onOpenConsumeModal(part)}
                        disabled={part.stockLeft === 0}
                        className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          part.stockLeft === 0
                            ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60'
                        }`}
                        title="Log part usage"
                      >
                        <MinusCircle className="h-3.5 w-3.5" />
                        <span>Use</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectPart(part)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>
                    )}

                    {/* Restock or Reorder Button (Manager, Admin) */}
                    {permissions.canRestock ? (
                      <button
                        id={`restock-btn-${part.id}`}
                        onClick={() => onOpenRestockModal(part)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                        title="Restock incoming parts"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Restock</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-[10px] text-slate-400">
                        Read Only
                      </div>
                    )}
                  </div>

                  {/* Secondary manager actions */}
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <button
                      onClick={() => onSelectPart(part)}
                      className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
                    >
                      Specifications &rsaquo;
                    </button>

                    <div className="flex items-center gap-2">
                      {permissions.canEditPart && (
                        <button
                          id={`edit-part-${part.id}`}
                          onClick={() => onOpenEditModal(part)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Edit Part SKU"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {permissions.canDeletePart && (
                        <button
                          id={`delete-part-${part.id}`}
                          onClick={() => onDeletePart(part)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete SKU"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500 sm:hidden dark:border-slate-800 dark:bg-slate-800/40">
            <span>Scroll horizontally to view all columns</span>
            <ArrowUpDown className="h-3 w-3 rotate-90 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Item / Number</th>
                  <th className="py-3.5 px-3">Location</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3 text-center">Stock Left</th>
                  <th className="py-3.5 px-3 text-center">Min Threshold</th>
                  <th className="py-3.5 px-3">Unit Price (₹)</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={part.imageUrl}
                          alt={part.name}
                          className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p 
                            onClick={() => onSelectPart(part)}
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer dark:text-white dark:hover:text-indigo-400"
                          >
                            {part.name}
                          </p>
                          <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                            {part.partNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>{part.location || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{part.category || 'General'}</td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={part.stockLeft === 0 ? 'text-rose-600' : part.stockLeft <= part.minThreshold ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}>
                        {part.stockLeft}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {part.minThreshold}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      ₹{part.unitCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      {statusBadge(part.status, part.stockLeft, part.minThreshold)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {permissions.canConsume && (
                          <button
                            onClick={() => onOpenConsumeModal(part)}
                            disabled={part.stockLeft === 0}
                            className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Consume Stock"
                          >
                            Use
                          </button>
                        )}
                        {permissions.canRestock && (
                          <button
                            onClick={() => onOpenRestockModal(part)}
                            className="rounded px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            title="Restock"
                          >
                            Add
                          </button>
                        )}
                        {permissions.canEditPart && (
                          <button
                            onClick={() => onOpenEditModal(part)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {permissions.canDeletePart && (
                          <button
                            onClick={() => onDeletePart(part)}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredParts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <TrendingDown className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No items match your filters</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search query, component category, or clearing the status filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedLocation('all');
              setStatusFilter('all');
              setOnlyNeedOrder(false);
            }}
            className="mt-4 rounded-lg bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
