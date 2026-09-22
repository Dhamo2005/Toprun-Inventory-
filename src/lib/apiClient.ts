import { SparePart, User, InventoryAlert, InventoryLog, ReorderOrder, DashboardStats, Category, LocationItem } from '../types.ts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('robopart_token') || 'usr_admin';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Guard with timeout so requests never hang indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out while contacting server at ${endpoint}. Please check server status.`);
    }
    throw new Error(`Server connection error: Unable to reach ${url}. Please verify the server is running.`);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const err = await res.json();
      throw new Error(err.error || `Server error (${res.status})`);
    }
    const text = await res.text();
    throw new Error(`Server returned error ${res.status}: ${text.slice(0, 120)}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return {} as T;
}

export const api = {
  // Categories & Locations (Relational)
  async getCategories(): Promise<Category[]> {
    const data = await request<{ categories: Category[] }>('/api/categories', {
      headers: getAuthHeaders()
    });
    return data.categories || [];
  },

  async createCategory(name: string): Promise<Category> {
    const data = await request<{ category: Category }>('/api/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return data.category;
  },

  async getLocations(): Promise<LocationItem[]> {
    const data = await request<{ locations: LocationItem[] }>('/api/locations', {
      headers: getAuthHeaders()
    });
    return data.locations || [];
  },

  async createLocation(name: string): Promise<LocationItem> {
    const data = await request<{ location: LocationItem }>('/api/locations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return data.location;
  },

  // Spare Parts / Items
  async getParts(params?: {
    search?: string;
    category?: string;
    location?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<SparePart[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.location) query.set('location', params.location);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);

    const data = await request<{ parts: SparePart[] }>(`/api/parts?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return data.parts || [];
  },

  async createPart(part: Partial<SparePart> & { category?: string; location?: string }): Promise<SparePart> {
    const data = await request<{ part: SparePart }>('/api/parts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(part)
    });
    return data.part;
  },

  async updatePart(id: string, part: Partial<SparePart> & { category?: string; location?: string }): Promise<SparePart> {
    const data = await request<{ part: SparePart }>(`/api/parts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(part)
    });
    return data.part;
  },

  async deletePart(id: string): Promise<void> {
    await request<void>(`/api/parts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async uploadPartImage(file: File): Promise<{ imageUrl: string; fileName: string; size: number }> {
    const token = localStorage.getItem('robopart_token') || 'usr_admin';
    const formData = new FormData();
    formData.append('image', file);

    const url = `${API_BASE}/api/upload`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    } catch (err: any) {
      throw new Error(`Upload connection failed: ${err.message}`);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `Failed to upload image (${res.status})`);
    }

    return await res.json();
  },

  async consumeStock(id: string, quantity: number, notes: string): Promise<SparePart> {
    const data = await request<{ part: SparePart }>(`/api/parts/${id}/consume`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity, notes })
    });
    return data.part;
  },

  async restockPart(id: string, quantity: number, notes: string): Promise<SparePart> {
    const data = await request<{ part: SparePart }>(`/api/parts/${id}/restock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity, notes })
    });
    return data.part;
  },

  async reorderPart(id: string, quantity: number): Promise<any> {
    return request<any>(`/api/parts/${id}/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity })
    });
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/stats', {
      headers: getAuthHeaders()
    });
  },

  // Alerts
  async getAlerts(): Promise<InventoryAlert[]> {
    const data = await request<{ alerts: InventoryAlert[] }>('/api/alerts', {
      headers: getAuthHeaders()
    });
    return data.alerts || [];
  },

  async resolveAlert(id: string): Promise<void> {
    await request<void>(`/api/alerts/${id}/resolve`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
  },

  // Inventory Logs
  async getLogs(partId?: string): Promise<InventoryLog[]> {
    const url = partId ? `/api/inventory/logs?partId=${encodeURIComponent(partId)}` : '/api/inventory/logs';
    const data = await request<{ logs: InventoryLog[] }>(url, {
      headers: getAuthHeaders()
    });
    return data.logs || [];
  },

  // Reorders
  async getReorders(): Promise<ReorderOrder[]> {
    const data = await request<{ orders: ReorderOrder[] }>('/api/reorders', {
      headers: getAuthHeaders()
    });
    return data.orders || [];
  },

  async updateReorderStatus(id: string, status: string): Promise<void> {
    await request<void>(`/api/reorders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },

  // Profile & Password Management
  async uploadImage(file: File): Promise<{ success: boolean; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('robopart_token');
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  async updateProfile(updates: { name: string; email: string; department?: string; avatar?: string }): Promise<User> {
    const data = await request<{ success: boolean; user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<void> {
    await request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords)
    });
  },

  // Users Management
  async getUsers(): Promise<User[]> {
    const data = await request<{ users: User[] }>('/api/users', {
      headers: getAuthHeaders()
    });
    return data.users || [];
  },

  async createUser(user: Partial<User> & { password?: string }): Promise<User> {
    const data = await request<{ user: User }>('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    return data.user;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const data = await request<{ user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    return data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await request<void>(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  }
};

// ----------------------------------------------------
// EXPORT UTILITIES (CSV, EXCEL, PDF)
// ----------------------------------------------------

export function exportToCSV(parts: SparePart[], filename = 'inventory-items.csv') {
  const headers = [
    'Item Number',
    'Item Name',
    'Description',
    'Category',
    'Location',
    'Current Stock',
    'Min Threshold',
    'Unit Price (INR)',
    'Total Stock Value (INR)',
    'Status',
    'Last Updated'
  ];

  const rows = parts.map(p => [
    `"${p.partNumber}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.location}"`,
    p.stockLeft,
    p.minThreshold,
    p.unitCost.toFixed(2),
    (p.stockLeft * p.unitCost).toFixed(2),
    `"${p.status}"`,
    `"${p.lastUpdated}"`
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

export function exportToExcel(parts: SparePart[], filename = 'inventory-items.xlsx') {
  const data = parts.map(p => ({
    'Item Number': p.partNumber,
    'Item Name': p.name,
    'Description': p.description || '',
    'Category': p.category,
    'Location': p.location,
    'Current Stock': p.stockLeft,
    'Min Threshold': p.minThreshold,
    'Unit Price (INR)': p.unitCost,
    'Total Value (INR)': Number((p.stockLeft * p.unitCost).toFixed(2)),
    'Status': p.status.replace('_', ' ').toUpperCase(),
    'Last Updated': p.lastUpdated
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Inventory');
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(parts: SparePart[], filename = 'inventory-items-report.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(10, 37, 122);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory Items Report', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 220, 15);

  // Summary Metrics Banner
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 28, 269, 16, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const totalStock = parts.reduce((acc, p) => acc + p.stockLeft, 0);
  const totalValuation = parts.reduce((acc, p) => acc + (p.stockLeft * p.unitCost), 0);

  doc.text(`Total Items: ${parts.length}`, 20, 38);
  doc.text(`Total Stock Units: ${totalStock}`, 90, 38);
  doc.text(`Total Valuation: INR ${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 180, 38);

  // Table Headers
  const startY = 52;
  doc.setFontSize(9);
  doc.setFillColor(226, 232, 240);
  doc.rect(14, startY - 4, 269, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');

  doc.text('Item Number', 16, startY + 1);
  doc.text('Item Name', 56, startY + 1);
  doc.text('Category', 125, startY + 1);
  doc.text('Location', 170, startY + 1);
  doc.text('Min Thresh', 215, startY + 1);
  doc.text('Stock', 242, startY + 1);
  doc.text('Unit Price', 265, startY + 1);

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

    if (p.status === 'critical') {
      doc.setTextColor(220, 38, 38);
    } else if (p.status === 'low_stock') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(30, 41, 59);
    }

    doc.text(p.partNumber.substring(0, 18), 16, curY + 1);
    doc.text(p.name.substring(0, 34), 56, curY + 1);
    doc.text(p.category.substring(0, 24), 125, curY + 1);
    doc.text(p.location.substring(0, 24), 170, curY + 1);
    doc.text(String(p.minThreshold), 220, curY + 1);
    doc.text(String(p.stockLeft), 246, curY + 1);
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
  const headers = ['Log ID', 'Timestamp', 'Event Type', 'Quantity Changed', 'Performed By', 'Audit Notes'];
  
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${new Date(l.timestamp).toLocaleString()}"`,
    `"${l.type.toUpperCase()}"`,
    l.quantity,
    `"${l.performedBy.replace(/"/g, '""')}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const headerInfo = [
    `"Item History Audit Trail: ${part.partNumber} - ${part.name.replace(/"/g, '""')}"`,
    `"Category: ${part.category} | Location: ${part.location} | Current Stock: ${part.stockLeft}"`,
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
  doc.text(`Location: ${part.location}`, 18, 40);
  doc.text(`Category: ${part.category}`, 18, 46);
  doc.text(`Current Stock: ${part.stockLeft}`, 18, 52);

  doc.text(`Min Threshold: ${part.minThreshold}`, 110, 40);
  doc.text(`Unit Price: INR ${part.unitCost.toFixed(2)}`, 110, 46);
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
      doc.text(`${l.quantity}`, 78, curY + 1);
      
      doc.setTextColor(30, 41, 59);
      doc.text(l.performedBy.substring(0, 24), 96, curY + 1);
      doc.text((l.notes || '-').substring(0, 40), 142, curY + 1);

      curY += 6;
    }
  }

  doc.save(filename);
}
