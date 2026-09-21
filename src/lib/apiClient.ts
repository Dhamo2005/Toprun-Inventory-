import { SparePart, User, InventoryAlert, InventoryLog, ReorderOrder, DashboardStats } from '../types.ts';
import { localStore } from './localStore.ts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('robopart_token') || 'usr_admin';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function safeRequest<T>(
  url: string,
  options: RequestInit,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // If successful and returned JSON
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
    
    // If error returned with JSON
    if (!res.ok && contentType.includes('application/json')) {
      const err = await res.json();
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    // If server returned HTML (e.g. Vercel 404 "The page could not be found")
    // or non-JSON content, seamlessly use localStore fallback
    return await fallbackFn();
  } catch (err: any) {
    // If it's a genuine validation error thrown above, rethrow
    if (err.message && !err.message.includes('Unexpected token') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
    // On network failure or HTML parse failure, use fallback
    return await fallbackFn();
  }
}

export const api = {
  // Spare Parts / Items
  async getParts(params?: {
    search?: string;
    category?: string;
    status?: string;
    robotModel?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<SparePart[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.robotModel) query.set('robotModel', params.robotModel);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);

    const result = await safeRequest(
      `/api/parts?${query.toString()}`,
      { headers: getAuthHeaders() },
      () => localStore.getParts(params)
    );
    return Array.isArray(result) ? result : ((result as any).parts || []);
  },

  async createPart(part: Partial<SparePart>): Promise<SparePart> {
    const result = await safeRequest(
      '/api/parts',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(part)
      },
      () => localStore.createPart(part)
    );
    return (result as any).part || result;
  },

  async updatePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await safeRequest(
      `/api/parts/${id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(part)
      },
      () => localStore.updatePart(id, part)
    );
    return (result as any).part || result;
  },

  async deletePart(id: string): Promise<void> {
    await safeRequest(
      `/api/parts/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      },
      () => localStore.deletePart(id)
    );
  },

  async consumeStock(id: string, quantity: number, notes: string): Promise<SparePart> {
    const result = await safeRequest(
      `/api/parts/${id}/consume`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity, notes })
      },
      () => localStore.consumeStock(id, quantity, notes)
    );
    return (result as any).part || result;
  },

  async restockPart(id: string, quantity: number, notes: string): Promise<SparePart> {
    const result = await safeRequest(
      `/api/parts/${id}/restock`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity, notes })
      },
      () => localStore.restockPart(id, quantity, notes)
    );
    return (result as any).part || result;
  },

  async reorderPart(id: string, quantity: number, supplier?: string): Promise<any> {
    return safeRequest(
      `/api/parts/${id}/reorder`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity, supplier })
      },
      () => localStore.createOrder({ partId: id, quantity })
    );
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return safeRequest(
      '/api/dashboard/stats',
      { headers: getAuthHeaders() },
      () => localStore.getStats()
    );
  },

  // Alerts
  async getAlerts(): Promise<InventoryAlert[]> {
    const result = await safeRequest(
      '/api/alerts',
      { headers: getAuthHeaders() },
      () => localStore.getAlerts()
    );
    return Array.isArray(result) ? result : ((result as any).alerts || []);
  },

  async resolveAlert(id: string): Promise<void> {
    await safeRequest(
      `/api/alerts/${id}/resolve`,
      {
        method: 'PUT',
        headers: getAuthHeaders()
      },
      () => localStore.resolveAlert(id)
    );
  },

  // Inventory Logs
  async getLogs(partId?: string): Promise<InventoryLog[]> {
    const url = partId ? `/api/inventory/logs?partId=${encodeURIComponent(partId)}` : '/api/inventory/logs';
    const result = await safeRequest(
      url,
      { headers: getAuthHeaders() },
      () => localStore.getLogs()
    );
    return Array.isArray(result) ? result : ((result as any).logs || []);
  },

  // Reorders
  async getReorders(): Promise<ReorderOrder[]> {
    const result = await safeRequest(
      '/api/reorders',
      { headers: getAuthHeaders() },
      () => localStore.getOrders()
    );
    return Array.isArray(result) ? result : ((result as any).orders || []);
  },

  async updateReorderStatus(id: string, status: string): Promise<void> {
    await safeRequest(
      `/api/reorders/${id}/status`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      },
      () => localStore.updateOrderStatus(id, status as any)
    );
  },

  // Users Management
  async getUsers(): Promise<User[]> {
    const result = await safeRequest(
      '/api/users',
      { headers: getAuthHeaders() },
      () => localStore.getUsers()
    );
    return Array.isArray(result) ? result : ((result as any).users || []);
  },

  async createUser(user: Partial<User> & { password?: string }): Promise<User> {
    const result = await safeRequest(
      '/api/users',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user)
      },
      () => localStore.createUser(user)
    );
    return (result as any).user || result;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const result = await safeRequest(
      `/api/users/${id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(user)
      },
      () => localStore.updateUser(id, user)
    );
    return (result as any).user || result;
  },

  async deleteUser(id: string): Promise<void> {
    await safeRequest(
      `/api/users/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      },
      () => localStore.deleteUser(id)
    );
  }
};

// ----------------------------------------------------
// EXPORT UTILITIES (CSV, EXCEL, PDF)
// ----------------------------------------------------

export function exportToCSV(parts: SparePart[], filename = 'toprun-inventory.csv') {
  const headers = [
    'Part Number',
    'Part Name',
    'Category',
    'Robot Model',
    'Stock Left',
    'Consumed',
    'Need To Order',
    'Min Threshold',
    'Unit Cost (INR)',
    'Total Stock Value (INR)',
    'Status',
    'Location',
    'Supplier',
    'Lead Time (Days)'
  ];

  const rows = parts.map(p => [
    `"${p.partNumber}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.robotModel}"`,
    p.stockLeft,
    p.consumed,
    p.needToOrder,
    p.minThreshold,
    p.unitCost.toFixed(2),
    (p.stockLeft * p.unitCost).toFixed(2),
    `"${p.status}"`,
    `"${p.location}"`,
    `"${p.supplier}"`,
    p.leadTimeDays
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(parts: SparePart[], filename = 'toprun-inventory.xlsx') {
  const data = parts.map(p => ({
    'Part Number': p.partNumber,
    'Name': p.name,
    'Category': p.category,
    'Robot Model': p.robotModel,
    'Stock Left': p.stockLeft,
    'Consumed': p.consumed,
    'Need To Order': p.needToOrder,
    'Min Threshold': p.minThreshold,
    'Unit Cost (INR)': p.unitCost,
    'Total Value (INR)': Number((p.stockLeft * p.unitCost).toFixed(2)),
    'Status': p.status.replace('_', ' ').toUpperCase(),
    'Location': p.location,
    'Supplier': p.supplier,
    'Lead Time (Days)': p.leadTimeDays
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Inventory');
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(parts: SparePart[], filename = 'toprun-inventory-report.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(10, 37, 122); // Toprun Navy #0A257A
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Toprun - Inventory Items Report', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 220, 15);

  // Summary Metrics Banner
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(14, 28, 269, 16, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const totalStock = parts.reduce((acc, p) => acc + p.stockLeft, 0);
  const totalConsumed = parts.reduce((acc, p) => acc + p.consumed, 0);
  const totalNeedOrder = parts.reduce((acc, p) => acc + p.needToOrder, 0);
  const totalValuation = parts.reduce((acc, p) => acc + (p.stockLeft * p.unitCost), 0);

  doc.text(`Total Parts: ${parts.length}`, 20, 38);
  doc.text(`In-Stock Units: ${totalStock}`, 80, 38);
  doc.text(`Consumed Units: ${totalConsumed}`, 145, 38);
  doc.text(`Need to Order: ${totalNeedOrder}`, 205, 38);
  doc.text(`Valuation: INR ${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 245, 38);

  // Table Headers
  const startY = 52;
  doc.setFontSize(9);
  doc.setFillColor(226, 232, 240);
  doc.rect(14, startY - 4, 269, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');

  doc.text('Part SKU', 16, startY + 1);
  doc.text('Part Name', 52, startY + 1);
  doc.text('Category', 118, startY + 1);
  doc.text('Robot Model', 162, startY + 1);
  doc.text('Stock', 205, startY + 1);
  doc.text('Consumed', 222, startY + 1);
  doc.text('Need Order', 242, startY + 1);
  doc.text('Unit (INR)', 265, startY + 1);

  // Rows
  let curY = startY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (curY > 190) {
      doc.addPage();
      curY = 20;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, curY - 3.5, 269, 7, 'F');
    }

    // Color code critical / low stock
    if (p.status === 'critical') {
      doc.setTextColor(220, 38, 38);
    } else if (p.status === 'low_stock') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(30, 41, 59);
    }

    doc.text(p.partNumber.substring(0, 18), 16, curY + 1);
    doc.text(p.name.substring(0, 34), 52, curY + 1);
    doc.text(p.category.substring(0, 24), 118, curY + 1);
    doc.text(p.robotModel.substring(0, 22), 162, curY + 1);
    doc.text(String(p.stockLeft), 208, curY + 1);
    doc.text(String(p.consumed), 226, curY + 1);
    doc.text(String(p.needToOrder), 246, curY + 1);
    doc.text(`INR ${p.unitCost.toFixed(2)}`, 265, curY + 1);

    curY += 7;
  }

  doc.save(filename);
}

// ----------------------------------------------------
// INDIVIDUAL PART HISTORY EXPORTS
// ----------------------------------------------------

export function exportPartHistoryToCSV(part: SparePart, logs: InventoryLog[]) {
  const filename = `${part.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_history.csv`;
  const headers = ['Log ID', 'Timestamp', 'Event Type', 'Quantity Changed', 'Unit', 'Performed By', 'Audit Notes'];
  
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${new Date(l.timestamp).toLocaleString()}"`,
    `"${l.type.toUpperCase()}"`,
    l.quantity,
    `"${part.unit || 'pcs'}"`,
    `"${l.performedBy.replace(/"/g, '""')}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const headerInfo = [
    `"Part History Audit Trail: ${part.partNumber} - ${part.name.replace(/"/g, '""')}"`,
    `"Category: ${part.category} | Robot Model: ${part.robotModel} | Current Stock: ${part.stockLeft} ${part.unit || 'pcs'}"`,
    ''
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [...headerInfo, headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPartHistoryToExcel(part: SparePart, logs: InventoryLog[]) {
  const filename = `${part.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_history.xlsx`;
  const data = logs.map(l => ({
    'Log ID': l.id,
    'Date & Time': new Date(l.timestamp).toLocaleString(),
    'Event Type': l.type.toUpperCase(),
    'Quantity Changed': l.quantity,
    'Unit': part.unit || 'pcs',
    'Performed By': l.performedBy,
    'Notes / Details': l.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock History');
  XLSX.writeFile(workbook, filename);
}

export function exportPartHistoryToPDF(part: SparePart, logs: InventoryLog[]) {
  const filename = `${part.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_history.pdf`;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Stock Movement & Audit History Ledger', 14, 14);

  // Part Profile Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 26, 182, 30, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${part.partNumber}: ${part.name.substring(0, 45)}`, 18, 33);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Robot Model: ${part.robotModel}`, 18, 40);
  doc.text(`Category: ${part.category}`, 18, 46);
  doc.text(`Current Stock: ${part.stockLeft} ${part.unit || 'pcs'}`, 18, 52);

  doc.text(`Min Threshold: ${part.minThreshold} ${part.unit || 'pcs'}`, 110, 40);
  doc.text(`Unit Cost: INR ${part.unitCost.toFixed(2)}`, 110, 46);
  doc.text(`Total Stock Value: INR ${(part.stockLeft * part.unitCost).toFixed(2)}`, 110, 52);

  // Table Headers
  const startY = 64;
  doc.setFontSize(8.5);
  doc.setFillColor(226, 232, 240);
  doc.rect(14, startY - 4, 182, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');

  doc.text('Date / Time', 16, startY + 1);
  doc.text('Event', 52, startY + 1);
  doc.text('Qty', 78, startY + 1);
  doc.text('User / Performer', 96, startY + 1);
  doc.text('Notes / Description', 142, startY + 1);

  // Rows
  let curY = startY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (logs.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No movement logs recorded yet for this item.', 16, curY + 2);
  } else {
    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      if (curY > 275) {
        doc.addPage();
        curY = 20;
      }

      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, curY - 3, 182, 6, 'F');
      }

      // Color code event type
      if (l.type === 'consumed') {
        doc.setTextColor(220, 38, 38);
      } else if (l.type === 'restocked') {
        doc.setTextColor(22, 163, 74);
      } else if (l.type === 'adjusted') {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(37, 99, 235);
      }

      doc.text(new Date(l.timestamp).toLocaleDateString() + ' ' + new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 16, curY + 1);
      doc.text(l.type.toUpperCase(), 52, curY + 1);
      doc.text(`${l.quantity} ${part.unit || 'pcs'}`, 78, curY + 1);
      
      doc.setTextColor(30, 41, 59);
      doc.text(l.performedBy.substring(0, 24), 96, curY + 1);
      doc.text((l.notes || '-').substring(0, 40), 142, curY + 1);

      curY += 6;
    }
  }

  doc.save(filename);
}
