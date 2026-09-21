import React, { useState, useEffect } from 'react';
import { SparePart, InventoryLog, PartCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api, exportPartHistoryToCSV, exportPartHistoryToExcel, exportPartHistoryToPDF } from '../lib/apiClient.ts';
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
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  DollarSign, 
  MapPin, 
  Building2, 
  Bot, 
  Layers, 
  Image as ImageIcon,
  ShoppingCart,
  MinusCircle,
  PlusCircle,
  Trash2,
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

const PRESET_IMAGES = [
  { name: 'Actuator / Reducer', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80' },
  { name: 'Servo Motor', url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80' },
  { name: 'Electric Gripper', url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80' },
  { name: 'Depth Camera / Vision', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80' },
  { name: 'LiDAR / Safety Scanner', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80' },
  { name: 'Teach Pendant', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80' },
  { name: 'Embedded Controller', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80' },
  { name: 'Battery Module', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80' },
  { name: 'Pneumatic Cylinder', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=80' },
  { name: 'Heavy Duty Cables', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80' },
];

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
  const { permissions, user } = useAuth();
  
  // Current active part
  const [activePartId, setActivePartId] = useState<string>(
    selectedPartId || (parts.length > 0 ? parts[0].id : '')
  );

  // Search filter for part picker
  const [partSearch, setPartSearch] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  // Modes: 'view' | 'edit' | 'add'
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');

  // Edit / Add Form State
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    imageUrl: '',
    unit: 'pcs',
    stockLeft: 0,
    minThreshold: 5,
    unitCost: 0,
    category: 'Actuators & Motors' as PartCategory,
    robotModel: '',
    description: '',
    location: '',
    supplier: '',
    leadTimeDays: 7
  });

  // History & Logs state for current part
  const [partLogs, setPartLogs] = useState<InventoryLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'consumed' | 'restocked' | 'adjusted' | 'reordered'>('all');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync with selectedPartId prop if updated externally
  useEffect(() => {
    if (selectedPartId && selectedPartId !== activePartId) {
      setActivePartId(selectedPartId);
      setMode('view');
    }
  }, [selectedPartId]);

  // Current selected part object
  const currentPart = parts.find(p => p.id === activePartId) || parts[0] || null;

  // Populate form when current part changes or edit mode entered
  useEffect(() => {
    if (currentPart && mode === 'view') {
      setFormData({
        name: currentPart.name,
        partNumber: currentPart.partNumber,
        imageUrl: currentPart.imageUrl,
        unit: currentPart.unit || 'pcs',
        stockLeft: currentPart.stockLeft,
        minThreshold: currentPart.minThreshold,
        unitCost: currentPart.unitCost,
        category: currentPart.category,
        robotModel: currentPart.robotModel,
        description: currentPart.description || '',
        location: currentPart.location,
        supplier: currentPart.supplier,
        leadTimeDays: currentPart.leadTimeDays
      });
    }
  }, [currentPart, mode]);

  // Fetch audit logs for the current part
  useEffect(() => {
    if (currentPart && mode !== 'add') {
      loadPartLogs(currentPart.id);
    } else {
      setPartLogs([]);
    }
  }, [currentPart?.id, mode]);

  const loadPartLogs = async (partId: string) => {
    setIsLogsLoading(true);
    try {
      const logs = await api.getLogs(partId);
      setPartLogs(logs);
    } catch (err) {
      console.error('Failed to load part logs:', err);
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
      unit: currentPart.unit || 'pcs',
      stockLeft: currentPart.stockLeft,
      minThreshold: currentPart.minThreshold,
      unitCost: currentPart.unitCost,
      category: currentPart.category,
      robotModel: currentPart.robotModel,
      description: currentPart.description || '',
      location: currentPart.location,
      supplier: currentPart.supplier,
      leadTimeDays: currentPart.leadTimeDays
    });
    setMode('edit');
  };

  const handleStartAdd = () => {
    setFormData({
      name: '',
      partNumber: `ROBO-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl: PRESET_IMAGES[0].url,
      unit: 'pcs',
      stockLeft: 10,
      minThreshold: 5,
      unitCost: 250.00,
      category: 'Actuators & Motors',
      robotModel: 'Universal UR10e',
      description: '',
      location: 'Bin A-01, Shelf 1',
      supplier: 'Robotics Supply Direct',
      leadTimeDays: 7
    });
    setMode('add');
  };

  const handleCancelForm = () => {
    setMode('view');
  };

  const handleSaveStockDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.partNumber.trim()) {
      showNotification('Part Name and SKU/Part Number are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'add') {
        const newPart = await api.createPart({
          ...formData,
          stockLeft: Number(formData.stockLeft) || 0,
          minThreshold: Number(formData.minThreshold) || 1,
          unitCost: Number(formData.unitCost) || 0,
          leadTimeDays: Number(formData.leadTimeDays) || 1
        });
        showNotification(`Successfully added new stock item: ${newPart.name}`);
        onRefreshParts();
        setActivePartId(newPart.id);
        if (onSelectPartId) onSelectPartId(newPart.id);
        setMode('view');
      } else if (mode === 'edit' && currentPart) {
        const updated = await api.updatePart(currentPart.id, {
          ...formData,
          stockLeft: Number(formData.stockLeft) || 0,
          minThreshold: Number(formData.minThreshold) || 1,
          unitCost: Number(formData.unitCost) || 0,
          leadTimeDays: Number(formData.leadTimeDays) || 1
        });
        showNotification(`Successfully updated stock details for ${updated.name}`);
        onRefreshParts();
        loadPartLogs(currentPart.id);
        setMode('view');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to save stock details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter parts for selector
  const filteredPartsList = parts.filter(p => 
    p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.robotModel.toLowerCase().includes(partSearch.toLowerCase())
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
            Stock Details
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View part details, change stock quantities, and download part history.
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
              Edit Part Details
            </button>
          )}

          {mode === 'view' && permissions.canEditPart && (
            <button
              id="add-new-stock-btn"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Add New Part
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
                Selected Stock:
              </span>
              <div className="relative">
                <button
                  id="stock-selector-dropdown-btn"
                  onClick={() => setIsPartDropdownOpen(!isPartDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 max-w-full"
                >
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                    {currentPart?.partNumber || 'Select Part'}
                  </span>
                  <span className="max-w-[140px] xs:max-w-[200px] sm:max-w-[340px] truncate">
                    {currentPart?.name || 'No part selected'}
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
                        placeholder="Search part name, SKU, or robot model..."
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
                            setMode('view');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                            p.id === currentPart?.id
                              ? 'bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/60 dark:text-indigo-200'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-7 w-7 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="truncate">
                              <p className="truncate font-medium">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.partNumber} • {p.robotModel}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.stockLeft === 0 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                              : p.stockLeft <= p.minThreshold
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {p.stockLeft} {p.unit || 'pcs'}
                          </span>
                        </button>
                      ))}
                      {filteredPartsList.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-400">No matching items found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick stock operations for viewed part */}
            {currentPart && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onOpenConsumeModal(currentPart)}
                  disabled={!permissions.canConsume || currentPart.stockLeft <= 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 min-h-[36px]"
                  title="Log component consumption / usage"
                >
                  <MinusCircle className="h-3.5 w-3.5" />
                  Log Usage
                </button>
                <button
                  onClick={() => onOpenRestockModal(currentPart)}
                  disabled={!permissions.canRestock}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 min-h-[36px]"
                  title="Restock part count"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Restock
                </button>
                <button
                  onClick={() => onOpenReorderModal(currentPart)}
                  disabled={!permissions.canReorder}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300 min-h-[36px]"
                  title="Generate replenishment PO"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Reorder PO
                </button>
                {permissions.canDeletePart && onDeletePart && (
                  <button
                    onClick={() => onDeletePart(currentPart)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30 min-h-[36px]"
                    title="Delete item SKU"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: Comprehensive Stock Detail Presentation */}
      {/* ========================================================================= */}
      {mode === 'view' && currentPart && (
        <div className="space-y-6">
          {/* Main Card: Image & Telemetry */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Component Image & Identification */}
            <div className="lg:col-span-4 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="relative aspect-video sm:aspect-square max-h-64 sm:max-h-none w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <img
                    src={currentPart.imageUrl}
                    alt={currentPart.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-md ${
                      currentPart.status === 'critical'
                        ? 'bg-rose-600 text-white'
                        : currentPart.status === 'low_stock'
                        ? 'bg-amber-500 text-white'
                        : currentPart.status === 'reorder_placed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {currentPart.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="inline-block rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                    {currentPart.partNumber}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {currentPart.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {currentPart.description || 'No detailed technical description provided for this component.'}
                  </p>
                </div>
              </div>

              {/* Physical Logistics Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Logistics & Supplier
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Storage Location
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPart.location}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      Supplier
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPart.supplier}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Lead Time
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPart.leadTimeDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Bot className="h-3.5 w-3.5 text-slate-400" />
                      Target Robot
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentPart.robotModel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Telemetry Gauges, Count & Valuation */}
            <div className="lg:col-span-8 space-y-6">
              {/* Key Stock Metrics Triad */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Stock Left / Count */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Stock Count Left
                    </span>
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      currentPart.stockLeft === 0 ? 'bg-rose-500 animate-ping' : currentPart.stockLeft <= currentPart.minThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {currentPart.stockLeft}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {currentPart.unit || 'pcs'}
                    </span>
                  </div>
                  {/* Progress bar vs minThreshold */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                      <span>Safety Buffer</span>
                      <span>Min: {currentPart.minThreshold} {currentPart.unit || 'pcs'}</span>
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

                {/* Consumed Count */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Historical Consumed
                    </span>
                    <ArrowDownLeft className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {currentPart.consumed}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {currentPart.unit || 'pcs'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    Total units utilized across maintenance shifts
                  </p>
                </div>

                {/* Need To Order */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Need To Order
                    </span>
                    <ArrowUpRight className={`h-4 w-4 ${currentPart.needToOrder > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold tracking-tight ${
                      currentPart.needToOrder > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {currentPart.needToOrder}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {currentPart.unit || 'pcs'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    {currentPart.needToOrder > 0
                      ? 'Replenishment order recommended'
                      : 'Stock levels comfortably above threshold'}
                  </p>
                </div>
              </div>

              {/* Financial & Valuation Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Cost & Stock Value
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Unit Cost</span>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      ₹{currentPart.unitCost.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-slate-500"> / {currentPart.unit || 'pcs'}</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Stock Value</span>
                    <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(currentPart.stockLeft * currentPart.unitCost).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Value Used</span>
                    <p className="mt-1 text-xl font-bold text-slate-700 dark:text-slate-300">
                      ₹{(currentPart.consumed * currentPart.unitCost).toLocaleString('en-IN')}
                    </p>
                  </div>
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
                      Complete activity ledger for {currentPart.partNumber} ({partLogs.length} events recorded)
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
                              {log.type === 'consumed' ? '-' : '+'}{log.quantity} {currentPart.unit || 'pcs'}
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

      {/* ========================================================================= */}
      {/* EDIT or ADD MODE: Inline Form on the Same Page */}
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
                      Modify Stock Details: {formData.name || currentPart?.name}
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'add'
                    ? 'Define identity, initial count, measuring unit, image, and safety thresholds.'
                    : 'Update hardware specs, live image, measuring unit, and direct inventory count.'}
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
              {/* Image Preview & Selector (Left side) */}
              <div className="lg:col-span-4 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Part Image Preview
                </label>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={formData.imageUrl || PRESET_IMAGES[0].url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    id="input-part-image"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Preset Image Suggestions */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
                    Or select a preset robotics image:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        title={preset.name}
                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          formData.imageUrl === preset.url
                            ? 'border-indigo-600 scale-105'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Stock Details & Parameters (Right side) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Part Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Part Name *
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

                  {/* SKU / Part Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SKU / Part Number *
                    </label>
                    <input
                      id="input-part-sku"
                      type="text"
                      required
                      value={formData.partNumber}
                      onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                      placeholder="e.g., HD-CSG-20-80"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      id="input-part-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PartCategory })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Robot Model */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Compatible Robot Model
                    </label>
                    <input
                      id="input-part-model"
                      type="text"
                      value={formData.robotModel}
                      onChange={(e) => setFormData({ ...formData, robotModel: e.target.value })}
                      placeholder="e.g., Universal UR10e, Boston Dynamics Spot"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Stock Count, Measuring Unit & Financials */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
                  {/* Stock Count */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Stock Count *
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
                    <span className="text-[10px] text-slate-400">Current available on shelf</span>
                  </div>

                  {/* Unit of Measurement */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Measuring Unit
                    </label>
                    <input
                      id="input-part-unit"
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs, sets, units"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400">e.g. pcs, sets, meters</span>
                  </div>

                  {/* Safety Min Threshold */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Min Threshold
                    </label>
                    <input
                      id="input-part-threshold"
                      type="number"
                      min="1"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400">Triggers low-stock alert</span>
                  </div>

                  {/* Unit Cost */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Cost (₹)
                    </label>
                    <input
                      id="input-part-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400">Purchase price per unit</span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Aisle 2, Bin M-04"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="e.g., Harmonic Drive LLC"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Technical Specifications / Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter gear ratio, voltage, encoder specs, or maintenance instructions..."
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
                {mode === 'add' ? 'Save & Add to Inventory' : 'Save Stock Details'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
