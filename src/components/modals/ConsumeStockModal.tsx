import React, { useState } from 'react';
import { SparePart } from '../../types.ts';
import { 
  MinusCircle, 
  AlertTriangle, 
  X, 
  Check, 
  Bot, 
  MapPin, 
  Boxes 
} from 'lucide-react';

interface ConsumeStockModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partId: string, quantity: number, notes: string) => Promise<void>;
}

export const ConsumeStockModal: React.FC<ConsumeStockModalProps> = ({
  part,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !part) return null;

  const newStock = Math.max(0, part.stockLeft - quantity);
  const willTriggerAlert = newStock <= part.minThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('Please specify a positive quantity.');
      return;
    }

    if (quantity > part.stockLeft) {
      setError(`Cannot consume ${quantity} units. Only ${part.stockLeft} currently available in stock.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(part.id, quantity, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock usage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <MinusCircle className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log Part Usage
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Part Summary Banner */}
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
              <span>{part.robotModel}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 text-[10px] uppercase block">In Stock</span>
            <span className="font-extrabold text-emerald-600 text-sm">{part.stockLeft}</span>
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
              Quantity Used
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="consume-qty-input"
                type="number"
                min="1"
                max={part.stockLeft}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-center text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex gap-1.5">
                {[1, 2, 4, 8].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(Math.min(part.stockLeft, q))}
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
              Reason / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Routine repair on Robot Arm 3"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Real-time stock calculation preview */}
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stock Preview
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Current Stock:</span>
              <span className="font-bold text-slate-900 dark:text-white">{part.stockLeft}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Stock Remaining After:</span>
              <span className={`font-extrabold ${newStock === 0 ? 'text-rose-600' : willTriggerAlert ? 'text-amber-600' : 'text-emerald-600'}`}>
                {newStock} units
              </span>
            </div>

            {willTriggerAlert && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Warning: Stock will fall below minimum limit ({part.minThreshold}) and trigger a reorder alert.</span>
              </div>
            )}
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
              id="confirm-consume-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-rose-700"
            >
              <Check className="h-4 w-4" />
              <span>Record Usage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
