import React, { useState } from 'react';
import { SparePart } from '../../types.ts';
import { 
  PlusCircle, 
  X, 
  Check, 
  Truck, 
  FileText 
} from 'lucide-react';

interface RestockModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partId: string, quantity: number, notes: string) => Promise<void>;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  part,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !part) return null;

  const newStock = part.stockLeft + quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('Please enter a valid restock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(part.id, quantity, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to restock part');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PlusCircle className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Part Summary */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <img
            src={part.imageUrl}
            alt={part.name}
            className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate dark:text-white text-xs sm:text-sm">
              {part.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{part.partNumber}</span>
              <span>&bull;</span>
              <span>{part.supplier}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 text-[10px] uppercase block">Current Stock</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{part.stockLeft}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Quantity to Add
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="restock-qty-input"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 rounded-xl border border-slate-200 bg-white py-2 px-3 text-center text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
              />
              <div className="flex gap-1.5">
                {[5, 10, 20].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Bill / Order Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received from supplier, Bill #104"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
            />
          </div>

          {/* New Stock Preview */}
          <div className="rounded-xl border border-slate-200 bg-emerald-50/40 p-3 dark:border-slate-800 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">New Stock Total:</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {newStock} units
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="confirm-restock-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Restock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
