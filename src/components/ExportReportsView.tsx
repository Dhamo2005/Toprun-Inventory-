import React, { useState } from 'react';
import { SparePart } from '../types.ts';
import { exportToCSV, exportToExcel, exportToPDF } from '../lib/apiClient.ts';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  Filter, 
  Calendar, 
  Sparkles,
  Table
} from 'lucide-react';

interface ExportReportsViewProps {
  parts: SparePart[];
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({ parts }) => {
  const [reportCategory, setReportCategory] = useState<string>('all');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const categories = Array.from(new Set(parts.map(p => p.category)));

  const filteredParts = parts.filter(p => {
    if (reportCategory !== 'all' && p.category !== reportCategory) return false;
    if (reportStatus !== 'all' && p.status !== reportStatus) return false;
    return true;
  });

  const totalStock = filteredParts.reduce((acc, p) => acc + p.stockLeft, 0);
  const lowStockCount = filteredParts.filter(p => p.stockLeft <= p.minThreshold).length;
  const totalValuation = filteredParts.reduce((acc, p) => acc + (p.stockLeft * p.unitCost), 0);

  const triggerDownload = (type: 'csv' | 'excel' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (type === 'csv') {
      exportToCSV(filteredParts, `toprun-report-${timestamp}.csv`);
      setDownloadSuccess('CSV Exported Successfully');
    } else if (type === 'excel') {
      exportToExcel(filteredParts, `toprun-report-${timestamp}.xlsx`);
      setDownloadSuccess('Excel (.xlsx) Exported Successfully');
    } else if (type === 'pdf') {
      exportToPDF(filteredParts, `toprun-report-${timestamp}.pdf`);
      setDownloadSuccess('PDF Report Generated Successfully');
    }

    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Export Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          Download inventory reports as CSV, Excel, or PDF.
        </p>
      </div>

      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* CSV Format */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Table className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              CSV Spreadsheet
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Comma-separated file. Opens in Excel or other spreadsheet tools.
            </p>
          </div>
          <button
            id="export-csv-btn"
            onClick={() => triggerDownload('csv')}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV ({filteredParts.length} Parts)</span>
          </button>
        </div>

        {/* Excel Format */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Microsoft Excel (.xlsx)
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Excel spreadsheet with part details, prices, and stock counts.
            </p>
          </div>
          <button
            id="export-excel-btn"
            onClick={() => triggerDownload('excel')}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>

        {/* PDF Format */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              PDF Report
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Printable PDF report with summary metrics and parts table.
            </p>
          </div>
          <button
            id="export-pdf-btn"
            onClick={() => triggerDownload('pdf')}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-rose-700"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Tailored Report Scope Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Filter Report
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category Filter</label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Component Categories ({parts.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Stock Status Filter</label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Only</option>
              <option value="critical">Critical / Depleted Only</option>
            </select>
          </div>
        </div>

        {/* Live Preview Summary Bar */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Report Summary
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Total Parts</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{filteredParts.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">In-Stock Units</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{totalStock}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Low Stock Items</span>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">{lowStockCount}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Total Value</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ₹{totalValuation.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
