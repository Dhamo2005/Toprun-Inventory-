import React from 'react';
import { SparePart } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  X, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  MinusCircle, 
  PlusCircle, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Box,
  ExternalLink
} from 'lucide-react';

interface PartDetailModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenConsume: (part: SparePart) => void;
  onOpenRestock: (part: SparePart) => void;
  onOpenReorder: (part: SparePart) => void;
  onNavigateToStockDetailPage?: (partId: string) => void;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  part,
  isOpen,
  onClose,
  onOpenConsume,
  onOpenRestock,
  onOpenReorder,
  onNavigateToStockDetailPage,
}) => {
  const { permissions } = useAuth();
  if (!isOpen || !part) return null;

  const stockPercent = Math.min(100, Math.round((part.stockLeft / (part.minThreshold * 2)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {part.partNumber}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {part.robotModel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Hardware Photo */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
            <img
              src={part.imageUrl}
              alt={part.name}
              className="h-56 w-full object-cover"
            />
          </div>

          {/* Core Info */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider dark:text-indigo-400">
                {part.category}
              </span>
              <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {part.name}
              </h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {part.description}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Unit Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₹{part.unitCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Stock Value:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(part.stockLeft * part.unitCost).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Supplier:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{part.supplier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Delivery Time:</span>
                <span>{part.leadTimeDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Location:</span>
                <span className="font-mono">{part.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Triple Stock Metric Panel: Left, Consumed, Need to Order */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Stock and Usage
          </h4>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center divide-x divide-slate-200 dark:divide-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-500">Left in Stock</span>
              <p className={`text-2xl font-extrabold mt-1 ${part.stockLeft === 0 ? 'text-rose-600' : part.stockLeft <= part.minThreshold ? 'text-amber-600' : 'text-emerald-600'}`}>
                {part.stockLeft}
              </p>
              <span className="text-[10px] text-slate-400">Min Limit: {part.minThreshold}</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500">Total Used</span>
              <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
                {part.consumed}
              </p>
              <span className="text-[10px] text-slate-400">Used in repairs</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500">Need to Order</span>
              <p className={`text-2xl font-extrabold mt-1 ${part.needToOrder > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                {part.needToOrder > 0 ? `+${part.needToOrder}` : '0'}
              </p>
              <span className="text-[10px] text-slate-400">
                {part.needToOrder > 0 ? 'Reorder needed' : 'Stock is OK'}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full ${
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

        {/* Action Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            Last Updated: {new Date(part.lastUpdated).toLocaleDateString()}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToStockDetailPage && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToStockDetailPage(part.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                <span>Full Detail & History</span>
              </button>
            )}

            {permissions.canConsume && (
              <button
                onClick={() => {
                  onClose();
                  onOpenConsume(part);
                }}
                disabled={part.stockLeft === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <MinusCircle className="h-4 w-4" />
                <span>Log Usage</span>
              </button>
            )}

            {permissions.canRestock && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRestock(part);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Restock</span>
              </button>
            )}

            {permissions.canReorder && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReorder(part);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Place Reorder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
