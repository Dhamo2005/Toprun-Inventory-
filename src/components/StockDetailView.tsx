import React, { useState, useEffect } from 'react';
import { SparePart, InventoryLog, Category, LocationItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api, exportPartHistoryToCSV, exportPartHistoryToExcel, exportPartHistoryToPDF } from '../lib/apiClient.ts';
import { ImageFileUpload } from './ImageFileUpload.tsx';
import { SearchableSelect } from './SearchableSelect.tsx';
import { PartImage } from './PartImage.tsx';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  Layers, 
  ChevronDown
} from 'lucide-react';

interface StockDetailViewProps {
  parts: SparePart[];
  selectedPartId?: string | null;
  onSelectPartId?: (id: string) => void;
  onRefreshParts: () => void;
  onOpenConsumeModal: (part: SparePart) => void;
  onOpenRestockModal: (part: SparePart) => void;
  onOpenReorderModal: (part: SparePart) => void;
  onDeletePart?: (part: SparePart) => void;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  parts,
  selectedPartId,
  onSelectPartId,
  onRefreshParts,
  onOpenConsumeModal,
  onOpenRestockModal,
  onOpenReorderModal,
  onDeletePart,
}) => {
  const { permissions } = useAuth();
  
  // Current active part
  const [activePartId, setActivePartId] = useState<string>(
    selectedPartId || (parts.length > 0 ? parts[0].id : '')
  );

  // Search filter for part picker
  const [partSearch, setPartSearch] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  // Modes: 'view' | 'edit' | 'add'
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');

  // Relational data
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Edit / Add Form State (Contains only required fields)
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    imageUrl: '',
    stockLeft: 0,
    minThreshold: 5,
    unitCost: 0,
    categoryId: '',
    category: '',
    locationId: '',
    location: '',
    description: '',
  });

  // History & Logs state for current part
  const [partLogs, setPartLogs] = useState<InventoryLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'consumed' | 'restocked' | 'adjusted' | 'reordered'>('all');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load relational categories and locations
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

  useEffect(() => {
    fetchRelations();
  }, []);

  // Sync with selectedPartId prop if updated externally
  useEffect(() => {
    if (selectedPartId && selectedPartId !== activePartId) {
      setActivePartId(selectedPartId);
      setMode('view');
    }
  }, [selectedPartId]);

  // Keep activePartId valid when parts array updates (e.g., after deletion)
  useEffect(() => {
    if (activePartId && !parts.some(p => p.id === activePartId)) {
      const fallbackId = parts.length > 0 ? parts[0].id : '';
      setActivePartId(fallbackId);
      if (onSelectPartId) onSelectPartId(fallbackId);
    }
  }, [parts, activePartId, onSelectPartId]);

  // Current selected part object
  const currentPart = parts.find(p => p.id === activePartId) || parts[0] || null;

  // Populate form when current part changes or edit mode entered
  useEffect(() => {
    if (currentPart && mode === 'view') {
      setFormData({
        name: currentPart.name,
        partNumber: currentPart.partNumber,
        imageUrl: currentPart.imageUrl,
        stockLeft: currentPart.stockLeft,
        minThreshold: currentPart.minThreshold,
        unitCost: currentPart.unitCost,
        categoryId: currentPart.categoryId || '',
        category: currentPart.category || '',
        locationId: currentPart.locationId || '',
        location: currentPart.location || '',
        description: currentPart.description || '',
      });
    }
  }, [currentPart, mode]);

  // Load logs when active part changes
  useEffect(() => {
    if (activePartId) {
      loadPartLogs(activePartId);
    }
  }, [activePartId]);

  const loadPartLogs = async (partId: string) => {
    setIsLogsLoading(true);
    try {
      const logs = await api.getLogs(partId);
      setPartLogs(logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleStartEdit = () => {
    if (!currentPart) return;
    setFormData({
      name: currentPart.name,
      partNumber: currentPart.partNumber,
      imageUrl: currentPart.imageUrl,
      stockLeft: currentPart.stockLeft,
      minThreshold: currentPart.minThreshold,
      unitCost: currentPart.unitCost,
      categoryId: currentPart.categoryId || '',
      category: currentPart.category || '',
      locationId: currentPart.locationId || '',
      location: currentPart.location || '',
      description: currentPart.description || '',
    });
    fetchRelations();
    setMode('edit');
  };

  const handleStartAdd = () => {
    setFormData({
      name: '',
      partNumber: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl: '',
      stockLeft: 10,
      minThreshold: 5,
      unitCost: 150.00,
      categoryId: categories.length > 0 ? categories[0].id : '',
      category: categories.length > 0 ? categories[0].name : '',
      locationId: locations.length > 0 ? locations[0].id : '',
      location: locations.length > 0 ? locations[0].name : '',
      description: '',
    });
    fetchRelations();
    setMode('add');
  };

  const handleCancelForm = () => {
    setMode('view');
  };

  const handleCreateCategory = async (catName: string) => {
    try {
      const created = await api.createCategory(catName);
      setCategories(prev => [...prev.filter(c => c.id !== created.id), created]);
      return created;
    } catch (err: any) {
      showNotification(err.message || 'Failed to create category', 'error');
      return null;
    }
  };

  const handleCreateLocation = async (locName: string) => {
    try {
      const created = await api.createLocation(locName);
      setLocations(prev => [...prev.filter(l => l.id !== created.id), created]);
      return created;
    } catch (err: any) {
      showNotification(err.message || 'Failed to create location', 'error');
      return null;
    }
  };

  const handleSaveStockDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.partNumber.trim()) {
      showNotification('Item Name and Item Number are required', 'error');
      return;
    }

    if (!formData.location.trim()) {
      showNotification('Location is required. Please select or add a location.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'add') {
        const newPart = await api.createPart({
          partNumber: formData.partNumber.trim(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          category: formData.category,
          locationId: formData.locationId,
          location: formData.location,
          stockLeft: Number(formData.stockLeft) || 0,
          minThreshold: Number(formData.minThreshold) || 1,
          unitCost: Number(formData.unitCost) || 0,
          imageUrl: formData.imageUrl || '',
        });
        showNotification(`Successfully added new item: ${newPart.name}`);
        onRefreshParts();
        setActivePartId(newPart.id);
        if (onSelectPartId) onSelectPartId(newPart.id);
        setMode('view');
      } else if (mode === 'edit' && currentPart) {
        const updated = await api.updatePart(currentPart.id, {
          partNumber: formData.partNumber.trim(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          category: formData.category,
          locationId: formData.locationId,
          location: formData.location,
          stockLeft: Number(formData.stockLeft) || 0,
          minThreshold: Number(formData.minThreshold) || 1,
          unitCost: Number(formData.unitCost) || 0,
          imageUrl: formData.imageUrl || '',
        });
        showNotification(`Successfully updated item details for ${updated.name}`);
        onRefreshParts();
        loadPartLogs(currentPart.id);
        setMode('view');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to save item details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter parts for selector
  const filteredPartsList = parts.filter(p => 
    p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(partSearch.toLowerCase())
  );

  // Filter history logs
  const filteredLogs = partLogs.filter(l => {
    if (logFilter === 'all') return true;
    return l.type === logFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Part Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Item Details
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage item number, location, threshold, image, and unit price.
          </p>
        </div>

        {/* Global Notification Toast */}
        {statusMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md dark:bg-white dark:text-slate-900 animate-in fade-in">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'view' && permissions.canEditPart && (
            <button
              id="modify-stock-btn"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Edit Item Details
            </button>
          )}

          {mode === 'view' && permissions.canEditPart && (
            <button
              id="add-new-stock-btn"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Add New Item
            </button>
          )}
        </div>
      </div>

      {/* Part Picker Bar (when in view or edit mode) */}
      {mode !== 'add' && (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Selected Item:
              </span>
              <div className="relative">
                <button
                  id="stock-selector-dropdown-btn"
                  onClick={() => setIsPartDropdownOpen(!isPartDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 max-w-full"
                >
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                    {currentPart?.partNumber || 'Select Item'}
                  </span>
                  <span className="max-w-[140px] xs:max-w-[200px] sm:max-w-[340px] truncate">
                    {currentPart?.name || 'No item selected'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-auto" />
                </button>

                {/* Dropdown Menu */}
                {isPartDropdownOpen && (
                  <div className="fixed sm:absolute left-2 sm:left-0 top-36 sm:top-full z-40 mt-1 w-[calc(100vw-1rem)] max-w-sm sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
                    <div className="relative mb-2 px-1">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search item name, SKU, or location..."
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredPartsList.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePartId(p.id);
                            if (onSelectPartId) onSelectPartId(p.id);
                            setIsPartDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl p-2 text-left text-xs transition-colors ${
                            p.id === currentPart?.id
                              ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950 dark:text-indigo-300'
                              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate">{p.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{p.partNumber} • {p.location}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            p.stockLeft === 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : p.stockLeft <= p.minThreshold
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {p.stockLeft} in stock
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Bar */}
            {currentPart && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="stock-view-restock-btn"
                  onClick={() => onOpenRestockModal(currentPart)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Restock
                </button>
                <button
                  id="stock-view-consume-btn"
                  onClick={() => onOpenConsumeModal(currentPart)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  Record Usage
                </button>
                <button
                  id="stock-view-reorder-btn"
                  onClick={() => onOpenReorderModal(currentPart)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  Reorder
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: Clean, Focused Details (Item number, Name, Description, Location, Min threshold, Image, Unit price) */}
      {/* ========================================================================= */}
      {mode === 'view' && currentPart && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Image & Core Details */}
            <div className="lg:col-span-4 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 relative">
                  <PartImage
                    src={currentPart.imageUrl}
                    alt={currentPart.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                      currentPart.stockLeft === 0
                        ? 'bg-rose-600 text-white'
                        : currentPart.stockLeft <= currentPart.minThreshold
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {currentPart.stockLeft === 0 ? 'Out of Stock' : currentPart.stockLeft <= currentPart.minThreshold ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <span className="inline-block rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                    Item #{currentPart.partNumber}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {currentPart.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {currentPart.description || 'No detailed technical description provided for this component.'}
                  </p>
                </div>
              </div>

              {/* Relational Location & Category Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Storage & Classification
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      Location
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {currentPart.location || 'General Storage'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Layers className="h-4 w-4 text-slate-400" />
                      Category
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {currentPart.category || 'General'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inventory Metrics & Audit History */}
            <div className="lg:col-span-8 space-y-6">
              {/* Key Stock Metrics Triad */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Stock Left */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Current Stock
                    </span>
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      currentPart.stockLeft === 0 ? 'bg-rose-500 animate-ping' : currentPart.stockLeft <= currentPart.minThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {currentPart.stockLeft}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Safety Level</span>
                      <span>Min: {currentPart.minThreshold}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentPart.stockLeft === 0
                            ? 'bg-rose-500'
                            : currentPart.stockLeft <= currentPart.minThreshold
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (currentPart.stockLeft / (currentPart.minThreshold * 2 || 10)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Minimum Threshold */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Minimum Threshold
                    </span>
                    <AlertTriangle className={`h-4 w-4 ${currentPart.stockLeft <= currentPart.minThreshold ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {currentPart.minThreshold}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    {currentPart.stockLeft <= currentPart.minThreshold ? 'Attention: Below minimum safety threshold' : 'Stock level is safely maintained'}
                  </p>
                </div>

                {/* Unit Price */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Unit Price
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">INR</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      ₹{currentPart.unitCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Total Value: ₹{(currentPart.stockLeft * currentPart.unitCost).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Movement & Audit History with Export Options */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Stock Movement & Audit History
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete activity ledger for Item #{currentPart.partNumber}
                    </p>
                  </div>

                  {/* Export History Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="export-part-history-csv"
                      onClick={() => exportPartHistoryToCSV(currentPart, partLogs)}
                      disabled={partLogs.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 min-h-[36px]"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                      CSV
                    </button>
                    <button
                      id="export-part-history-excel"
                      onClick={() => exportPartHistoryToExcel(currentPart, partLogs)}
                      disabled={partLogs.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300 min-h-[36px]"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                    <button
                      id="export-part-history-pdf"
                      onClick={() => exportPartHistoryToPDF(currentPart, partLogs)}
                      disabled={partLogs.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 min-h-[36px]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(['all', 'consumed', 'restocked', 'adjusted', 'reordered'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                        logFilter === filter
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs min-w-[540px]">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Date / Time</th>
                        <th className="py-2.5 px-3">Event</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Performed By</th>
                        <th className="py-2.5 px-3">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                      {isLogsLoading ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">Loading audit history...</td>
                        </tr>
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">No movement events found for this filter.</td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                log.type === 'consumed'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : log.type === 'restocked'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : log.type === 'adjusted'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {log.type === 'consumed' ? '-' : '+'}{log.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {log.performedBy}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[260px] truncate">
                              {log.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'view' && !currentPart && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Item Selected</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            The selected item was removed or the inventory catalog is empty. Select an item from the dropdown above or create a new item.
          </p>
          {permissions.canEditPart && (
            <button
              onClick={() => setMode('add')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add New Item
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT or ADD MODE: Only requested fields with SearchableSelect */}
      {/* ========================================================================= */}
      {(mode === 'edit' || mode === 'add') && (
        <form onSubmit={handleSaveStockDetails} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header of Form */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {mode === 'add' ? (
                    <>
                      <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Add New Item
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Edit Item Details: {formData.name || currentPart?.name}
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage Item number, Item Name, Description, Location, Minimum threshold, Image, and Unit price.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Image File Handler & Preview (Left side) */}
              <div className="lg:col-span-4 space-y-4">
                <ImageFileUpload
                  currentImageUrl={formData.imageUrl}
                  onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  label="Item Image (Upload or link)"
                  helperText="Upload image file directly to server storage. No third-party image services are used."
                />
              </div>

              {/* Core Item Details (Right side) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Item Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Item Number *
                    </label>
                    <input
                      id="input-part-sku"
                      type="text"
                      required
                      value={formData.partNumber}
                      onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                      placeholder="e.g., SKU-1049"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Item Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Item Name *
                    </label>
                    <input
                      id="input-part-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Harmonic Drive Gear Reducer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Relational Location & Category: Searchable Select with Duplicate Prevention */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SearchableSelect
                    id="input-part-location"
                    label="Location"
                    placeholder="Search or select location..."
                    options={locations}
                    value={formData.location}
                    required
                    onChange={(name, id) => {
                      setFormData(prev => ({
                        ...prev,
                        location: name,
                        locationId: id,
                      }));
                    }}
                    onCreateOption={handleCreateLocation}
                  />

                  <SearchableSelect
                    id="input-part-category"
                    label="Category"
                    placeholder="Search or select category..."
                    options={categories}
                    value={formData.category}
                    onChange={(name, id) => {
                      setFormData(prev => ({
                        ...prev,
                        category: name,
                        categoryId: id,
                      }));
                    }}
                    onCreateOption={handleCreateCategory}
                  />
                </div>

                {/* Stock Count, Safety Min Threshold & Unit Price */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                  {/* Stock Count */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Stock Count *
                    </label>
                    <input
                      id="input-part-count"
                      type="number"
                      min="0"
                      required
                      value={formData.stockLeft}
                      onChange={(e) => setFormData({ ...formData, stockLeft: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Safety Min Threshold */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum Threshold *
                    </label>
                    <input
                      id="input-part-threshold"
                      type="number"
                      min="1"
                      required
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Price (₹) *
                    </label>
                    <input
                      id="input-part-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Item Description */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter item description, specifications, dimensions, or notes..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Form Action Footer */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={isSaving}
                className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                id="save-stock-details-btn"
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {mode === 'add' ? 'Save & Add Item' : 'Save Item Details'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
