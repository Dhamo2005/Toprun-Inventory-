import React, { useState } from 'react';
import { SparePart } from '../../types.ts';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Bot, 
  MapPin, 
  Package, 
  Tag, 
  IndianRupee, 
  Truck,
  Layers,
  History
} from 'lucide-react';

interface DeletePartModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partId: string) => Promise<void>;
}

export const DeletePartModal: React.FC<DeletePartModalProps> = ({
  part,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !part) return null;

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);
    try {
      await onConfirm(part.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      setIsDeleting(false);
    }
  };

  const totalValue = part.stockLeft * part.unitCost;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Item
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm permanent removal of this inventory item
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Item Summary Card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-mono font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  {part.partNumber}
                </span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {part.category}
                </span>
              </div>
              <h4 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                {part.name}
              </h4>
            </div>
          </div>

          {/* Detailed Item Attributes */}
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Bot className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">Robot: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{part.robotModel}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Current Stock: <strong className="text-slate-800 dark:text-slate-200 font-bold">{part.stockLeft} {part.unit || 'pcs'}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Min Limit: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{part.minThreshold} {part.unit || 'pcs'}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <History className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Total Used: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{part.consumed} {part.unit || 'pcs'}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <IndianRupee className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Unit Price: <strong className="text-slate-800 dark:text-slate-200 font-semibold">₹{part.unitCost.toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Total Value: <strong className="text-slate-800 dark:text-slate-200 font-semibold">₹{totalValue.toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">Location: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{part.location}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">Supplier: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{part.supplier}</strong></span>
            </div>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-200">
              Are you sure you want to delete this item?
            </p>
            <p className="mt-1 text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
              This action cannot be undone. The item SKU, inventory counts, maintenance tracking references, and reorder records for this item will be removed.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[38px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 min-h-[38px]"
          >
            {isDeleting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Deleting Item...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Item</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
