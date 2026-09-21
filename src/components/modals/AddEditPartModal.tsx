import React, { useState, useEffect } from 'react';
import { SparePart, PartCategory } from '../../types.ts';
import { X, Check, Boxes, Image as ImageIcon } from 'lucide-react';

interface AddEditPartModalProps {
  part?: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: Partial<SparePart>) => Promise<void>;
}

const CATEGORIES: PartCategory[] = [
  'Actuators & Motors',
  'Sensors & Vision',
  'End Effectors & Grippers',
  'Compute & Control Boards',
  'Power & Battery Systems',
  'Cables & Connectors',
  'Pneumatics & Hydraulics',
  'Structural & Mechanical'
];

export const AddEditPartModal: React.FC<AddEditPartModalProps> = ({
  part,
  isOpen,
  onClose,
  onSave,
}) => {
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PartCategory>('Actuators & Motors');
  const [robotModel, setRobotModel] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockLeft, setStockLeft] = useState<number>(5);
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [consumed, setConsumed] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(450);
  const [unit, setUnit] = useState<string>('pcs');
  const [supplier, setSupplier] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (part) {
      setPartNumber(part.partNumber);
      setName(part.name);
      setCategory(part.category);
      setRobotModel(part.robotModel);
      setDescription(part.description || '');
      setImageUrl(part.imageUrl || '');
      setStockLeft(part.stockLeft);
      setMinThreshold(part.minThreshold);
      setConsumed(part.consumed);
      setUnitCost(part.unitCost);
      setUnit(part.unit || 'pcs');
      setSupplier(part.supplier);
      setLeadTimeDays(part.leadTimeDays);
      setLocation(part.location);
    } else {
      setPartNumber(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setCategory('Actuators & Motors');
      setRobotModel('Universal UR10e');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80');
      setStockLeft(6);
      setMinThreshold(4);
      setConsumed(0);
      setUnitCost(750);
      setUnit('pcs');
      setSupplier('Robotics Precision Supply');
      setLeadTimeDays(10);
      setLocation('Bay A, Rack 1-B');
    }
  }, [part, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!partNumber || !name || !robotModel) {
      setError('Part number, name, and robot model are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        partNumber,
        name,
        category,
        robotModel,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
        stockLeft: Number(stockLeft),
        minThreshold: Number(minThreshold),
        consumed: Number(consumed),
        unitCost: Number(unitCost),
        unit: unit || 'pcs',
        supplier: supplier || 'Global Robotics',
        leadTimeDays: Number(leadTimeDays),
        location: location || 'Warehouse Bay 1',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Boxes className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {part ? 'Edit Item' : 'Add New Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Part Number</label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. HD-CSG-20-80"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 font-mono text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Part Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Harmonic Strain Wave Reducer"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartCategory)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Robot Model / Fleet</label>
              <input
                type="text"
                required
                value={robotModel}
                onChange={(e) => setRobotModel(e.target.value)}
                placeholder="e.g. Universal UR10e, Boston Dynamics Spot"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Engineering Description & Specs</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, torque rating, voltage, compatible firmware..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Hardware Image URL</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0 dark:border-slate-700"
                />
              )}
            </div>
          </div>

          {/* Stock Metrics Inputs */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Stock Levels & Limits
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Stock Left</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockLeft}
                  onChange={(e) => setStockLeft(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs, sets"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Min Threshold</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Consumed</label>
                <input
                  type="number"
                  min="0"
                  value={consumed}
                  onChange={(e) => setConsumed(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Maxon Motors"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 7)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Warehouse Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Aisle 2, Bin M-04"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="save-part-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Check className="h-4 w-4" />
              <span>{part ? 'Update Item' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
