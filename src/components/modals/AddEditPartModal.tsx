import React, { useState, useEffect } from 'react';
import { SparePart, Category, LocationItem } from '../../types.ts';
import { X, Check, Boxes } from 'lucide-react';
import { ImageFileUpload } from '../ImageFileUpload.tsx';
import { SearchableSelect } from '../SearchableSelect.tsx';
import { api } from '../../lib/apiClient.ts';

interface AddEditPartModalProps {
  part?: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: Partial<SparePart> & { category?: string; location?: string }) => Promise<void>;
}

export const AddEditPartModal: React.FC<AddEditPartModalProps> = ({
  part,
  isOpen,
  onClose,
  onSave,
}) => {
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number>(150);
  const [stockLeft, setStockLeft] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load relational categories and locations
  useEffect(() => {
    if (!isOpen) return;
    const fetchRelations = async () => {
      try {
        const [cats, locs] = await Promise.all([
          api.getCategories(),
          api.getLocations()
        ]);
        setCategories(cats);
        setLocations(locs);
      } catch (err) {
        console.error('Failed to load categories/locations:', err);
      }
    };
    fetchRelations();
  }, [isOpen]);

  useEffect(() => {
    if (part) {
      setPartNumber(part.partNumber);
      setName(part.name);
      setDescription(part.description || '');
      setCategoryId(part.categoryId || '');
      setCategoryName(part.category || '');
      setLocationId(part.locationId || '');
      setLocationName(part.location || '');
      setMinThreshold(part.minThreshold);
      setUnitCost(part.unitCost);
      setStockLeft(part.stockLeft);
      setImageUrl(part.imageUrl || '');
    } else {
      setPartNumber(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setDescription('');
      setCategoryId('');
      setCategoryName('');
      setLocationId('');
      setLocationName('');
      setMinThreshold(5);
      setUnitCost(150);
      setStockLeft(5);
      setImageUrl('');
    }
  }, [part, isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = async (catName: string) => {
    try {
      const created = await api.createCategory(catName);
      setCategories(prev => [...prev.filter(c => c.id !== created.id), created]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      return null;
    }
  };

  const handleCreateLocation = async (locName: string) => {
    try {
      const created = await api.createLocation(locName);
      setLocations(prev => [...prev.filter(l => l.id !== created.id), created]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!partNumber.trim() || !name.trim()) {
      setError('Item number and Item Name are required.');
      return;
    }

    if (!locationName.trim()) {
      setError('Location is required. Please select or add a location.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        partNumber: partNumber.trim(),
        name: name.trim(),
        description: description.trim(),
        categoryId,
        category: categoryName || 'General Category',
        locationId,
        location: locationName || 'General Storage',
        minThreshold: Number(minThreshold) || 1,
        unitCost: Number(unitCost) || 0,
        stockLeft: Number(stockLeft) || 0,
        imageUrl: imageUrl || '',
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
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Boxes className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {part ? 'Edit Item Details' : 'Add New Item'}
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
          {/* Item Number & Item Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. SKU-8021"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Servo Motor Controller"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Relational Location & Category with Searchable Select (No Duplicates) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect
              id="part-location-select"
              label="Location"
              placeholder="Search or select location..."
              options={locations}
              value={locationName}
              required
              onChange={(name, id) => {
                setLocationName(name);
                setLocationId(id);
              }}
              onCreateOption={handleCreateLocation}
            />

            <SearchableSelect
              id="part-category-select"
              label="Category"
              placeholder="Search or select category..."
              options={categories}
              value={categoryName}
              onChange={(name, id) => {
                setCategoryName(name);
                setCategoryId(id);
              }}
              onCreateOption={handleCreateCategory}
            />
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, dimensions, notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Numeric Fields: Minimum Threshold, Unit Price, Stock */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockLeft}
                  onChange={(e) => setStockLeft(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Threshold <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-center font-bold text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Item Image */}
          <ImageFileUpload
            currentImageUrl={imageUrl}
            onImageChange={(url) => setImageUrl(url)}
            label="Item Image"
            helperText="Upload an image for this item or provide an image link."
          />

          {/* Modal Action Buttons */}
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
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
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

