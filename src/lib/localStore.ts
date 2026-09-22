import { SparePart, User, UserRole, InventoryAlert, InventoryLog, ReorderOrder, DashboardStats, Category, LocationItem } from '../types.ts';

const LOCAL_STORAGE_KEY_PREFIX = 'robopart_store_';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-001', name: 'Actuators & Motors', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-002', name: 'Sensors & Feedback', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-003', name: 'End Effectors & Tooling', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-004', name: 'Controllers & Electronics', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-005', name: 'Pneumatics & Hydraulics', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-006', name: 'Power & Cables', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'cat-007', name: 'Mechanical & Structural', createdAt: '2025-01-10T08:00:00.000Z' },
];

const INITIAL_LOCATIONS: LocationItem[] = [
  { id: 'loc-001', name: 'Aisle 1, Bin E-12', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-002', name: 'Aisle 2, Bin M-04', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-003', name: 'Aisle 3, Bin S-02', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-004', name: 'Aisle 4, Bin E-01', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-005', name: 'Rack 1, Shelf B-2', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-006', name: 'Rack 2, Bin P-09', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-007', name: 'Cabinet 4, Drawer 1', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'loc-008', name: 'Secure Vault A, Bay 2', createdAt: '2025-01-10T08:00:00.000Z' },
];

const INITIAL_USERS: (User & { password?: string })[] = [
  {
    id: 'usr_admin',
    name: 'Dr. Elena Vance',
    email: 'admin@toprun.com',
    password: 'password123',
    role: 'admin',
    department: 'Robotics Engineering & Operations',
    avatar: '',
    createdAt: '2025-01-10T08:00:00.000Z',
  },
  {
    id: 'usr_manager',
    name: 'Marcus Reyes',
    email: 'manager@toprun.com',
    password: 'password123',
    role: 'manager',
    department: 'Warehouse & Fulfillment',
    avatar: '',
    createdAt: '2025-01-11T09:30:00.000Z',
  },
  {
    id: 'usr_tech',
    name: 'Alex Mercer',
    email: 'tech@toprun.com',
    password: 'password123',
    role: 'technician',
    department: 'Field Maintenance Cell B',
    avatar: '',
    createdAt: '2025-01-12T14:15:00.000Z',
  },
  {
    id: 'usr_viewer',
    name: 'Sarah Jenkins',
    email: 'viewer@toprun.com',
    password: 'password123',
    role: 'viewer',
    department: 'Financial Auditing',
    avatar: '',
    createdAt: '2025-01-15T11:00:00.000Z',
  },
];

const INITIAL_PARTS: SparePart[] = [
  {
    id: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    name: 'Harmonic Drive Strain Wave Reducer',
    category: 'Actuators & Motors',
    categoryId: 'cat-001',
    description: 'Zero-backlash precision gear assembly for joint 2 & 3 rotation, 80:1 ratio with cross-roller bearing.',
    imageUrl: '',
    stockLeft: 2,
    minThreshold: 5,
    unitCost: 1450.00,
    location: 'Aisle 2, Bin M-04',
    locationId: 'loc-002',
    status: 'critical',
    lastUpdated: '2025-02-14T09:12:00.000Z',
  },
  {
    id: 'prt-002',
    partNumber: 'MXN-ECI-40',
    name: 'Maxon EC-i 40 100W Brushless Servo Motor',
    category: 'Actuators & Motors',
    categoryId: 'cat-001',
    description: 'High-torque brushless DC motor with hall sensors and digital incremental encoder for robotic quadrupeds.',
    imageUrl: '',
    stockLeft: 4,
    minThreshold: 6,
    unitCost: 820.00,
    location: 'Rack 1, Shelf B-2',
    locationId: 'loc-005',
    status: 'low_stock',
    lastUpdated: '2025-02-16T11:45:00.000Z',
  },
  {
    id: 'prt-003',
    partNumber: 'SICK-DSL-EKM36',
    name: 'SICK HIPERFACE DSL Absolute Motor Encoder',
    category: 'Sensors & Feedback',
    categoryId: 'cat-002',
    description: 'High-resolution single-cable absolute optical rotary encoder for servo position synchronization.',
    imageUrl: '',
    stockLeft: 0,
    minThreshold: 4,
    unitCost: 780.00,
    location: 'Cabinet 4, Drawer 1',
    locationId: 'loc-007',
    status: 'critical',
    lastUpdated: '2025-02-19T16:30:00.000Z',
  },
  {
    id: 'prt-004',
    partNumber: 'ROB-2F85',
    name: 'Robotiq 2F-85 Adaptive Parallel Gripper Finger Kit',
    category: 'End Effectors & Tooling',
    categoryId: 'cat-003',
    description: 'Hardened silicone grip pads, dual link drive mechanism, and mechanical coupling flange.',
    imageUrl: '',
    stockLeft: 7,
    minThreshold: 4,
    unitCost: 620.00,
    location: 'Aisle 1, Bin E-12',
    locationId: 'loc-001',
    status: 'in_stock',
    lastUpdated: '2025-02-18T14:10:00.000Z',
  },
  {
    id: 'prt-005',
    partNumber: 'OMR-E3Z-D61',
    name: 'Omron Photoelectric Proximity Sensor 24VDC',
    category: 'Sensors & Feedback',
    categoryId: 'cat-002',
    description: 'Diffuse-reflective optical sensor, 100mm sensing distance with IP67 washdown rating.',
    imageUrl: '',
    stockLeft: 16,
    minThreshold: 8,
    unitCost: 95.00,
    location: 'Aisle 3, Bin S-02',
    locationId: 'loc-003',
    status: 'in_stock',
    lastUpdated: '2025-02-17T10:00:00.000Z',
  },
  {
    id: 'prt-006',
    partNumber: 'KUK-KRC4-PC',
    name: 'KUKA KRC4 Industrial Motherboard & Core Controller',
    category: 'Controllers & Electronics',
    categoryId: 'cat-004',
    description: 'Main industrial PC board with EtherCAT real-time master interface and isolated safety bus.',
    imageUrl: '',
    stockLeft: 1,
    minThreshold: 3,
    unitCost: 3850.00,
    location: 'Secure Vault A, Bay 2',
    locationId: 'loc-008',
    status: 'critical',
    lastUpdated: '2025-02-15T08:20:00.000Z',
  },
  {
    id: 'prt-007',
    partNumber: 'SMC-MGPL25-50',
    name: 'SMC Compact Pneumatic Guided Cylinder',
    category: 'Pneumatics & Hydraulics',
    categoryId: 'cat-005',
    description: 'Compact guide cylinder, 25mm bore, 50mm stroke with ball bushing bearing for high-cycle tooling.',
    imageUrl: '',
    stockLeft: 3,
    minThreshold: 5,
    unitCost: 285.00,
    location: 'Rack 2, Bin P-09',
    locationId: 'loc-006',
    status: 'low_stock',
    lastUpdated: '2025-02-18T11:00:00.000Z',
  },
  {
    id: 'prt-008',
    partNumber: 'MW-NDR-480-24',
    name: 'Mean Well 24V 20A 480W Industrial DIN Rail PSU',
    category: 'Power & Cables',
    categoryId: 'cat-006',
    description: 'Ultra-slim single phase DIN rail switching power supply with 92.5% efficiency and active PFC.',
    imageUrl: '',
    stockLeft: 12,
    minThreshold: 4,
    unitCost: 110.00,
    location: 'Aisle 4, Bin E-01',
    locationId: 'loc-004',
    status: 'in_stock',
    lastUpdated: '2025-02-10T14:00:00.000Z',
  },
];

const INITIAL_LOGS: InventoryLog[] = [
  {
    id: 'log-001',
    partId: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    partName: 'Harmonic Drive Strain Wave Reducer',
    type: 'consumed',
    quantity: 1,
    performedBy: 'Alex Mercer (Technician)',
    notes: 'Emergency Joint 3 gear replacement on Cell 4 UR10e after torque fault.',
    timestamp: '2025-02-14T09:12:00.000Z',
  },
  {
    id: 'log-002',
    partId: 'prt-002',
    partNumber: 'MXN-ECI-40',
    partName: 'Maxon EC-i 40 100W Brushless Servo Motor',
    type: 'restocked',
    quantity: 4,
    performedBy: 'Marcus Reyes (Manager)',
    notes: 'Replenishment delivery batch #MXN-9942 checked into shelf B-2.',
    timestamp: '2025-02-16T11:45:00.000Z',
  },
];

const INITIAL_REORDERS: ReorderOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'PO-2025-001',
    partId: 'prt-003',
    partNumber: 'SICK-DSL-EKM36',
    partName: 'SICK HIPERFACE DSL Absolute Motor Encoder',
    quantity: 8,
    status: 'pending',
    totalCost: 6240.00,
    orderedBy: 'Marcus Reyes (Manager)',
    createdAt: '2025-02-19T17:15:00.000Z',
  },
  {
    id: 'ord-002',
    orderNumber: 'PO-2025-002',
    partId: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    partName: 'Harmonic Drive Strain Wave Reducer',
    quantity: 8,
    status: 'approved',
    totalCost: 11600.00,
    orderedBy: 'Dr. Elena Vance (Admin)',
    createdAt: '2025-02-15T10:00:00.000Z',
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    if (val) return JSON.parse(val);
  } catch (e) {
    // Ignore storage errors
  }
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // Ignore storage errors
  }
}

// Generate automatic alerts based on parts stock level
function computeAlerts(parts: SparePart[]): InventoryAlert[] {
  const existingAlerts = getStored<InventoryAlert[]>('alerts', []);
  const resolvedIds = new Set(existingAlerts.filter(a => a.isResolved).map(a => a.partId));

  const alerts: InventoryAlert[] = [];
  for (const part of parts) {
    if (part.stockLeft === 0) {
      alerts.push({
        id: `alt-crit-${part.id}`,
        partId: part.id,
        partNumber: part.partNumber,
        partName: part.name,
        severity: 'critical',
        title: `CRITICAL: Stock Depleted (0 Units)`,
        message: `${part.name} (${part.partNumber}) has 0 items remaining in ${part.location || 'storage'}. Replenishment required immediately.`,
        isResolved: resolvedIds.has(part.id),
        createdAt: part.lastUpdated || new Date().toISOString(),
      });
    } else if (part.stockLeft <= part.minThreshold) {
      alerts.push({
        id: `alt-low-${part.id}`,
        partId: part.id,
        partNumber: part.partNumber,
        partName: part.name,
        severity: 'warning',
        title: `Low Stock Warning (${part.stockLeft}/${part.minThreshold})`,
        message: `${part.name} (${part.partNumber}) is at or below its safe threshold of ${part.minThreshold} units.`,
        isResolved: resolvedIds.has(part.id),
        createdAt: part.lastUpdated || new Date().toISOString(),
      });
    }
  }
  return alerts;
}

export const localStore = {
  getParts(): SparePart[] {
    const parts = getStored<SparePart[]>('parts', INITIAL_PARTS);
    return parts;
  },

  createPart(data: Partial<SparePart> & { category?: string; location?: string }): SparePart {
    const parts = this.getParts();
    const newId = `prt-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`;
    const stockLeft = Number(data.stockLeft) || 0;
    const minThreshold = Number(data.minThreshold) || 5;

    let status = 'in_stock';
    if (stockLeft === 0) status = 'critical';
    else if (stockLeft <= minThreshold) status = 'low_stock';

    const newPart: SparePart = {
      id: newId,
      partNumber: data.partNumber || `SKU-${Date.now().toString().slice(-6)}`,
      name: data.name || 'Unnamed Part',
      category: data.category || 'Mechanical & Structural',
      categoryId: data.categoryId || '',
      location: data.location || 'General Storage',
      locationId: data.locationId || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      stockLeft,
      minThreshold,
      unitCost: Number(data.unitCost) || 0,
      status: status as any,
      lastUpdated: new Date().toISOString(),
    };

    const updated = [newPart, ...parts];
    setStored('parts', updated);
    return newPart;
  },

  updatePart(id: string, updates: Partial<SparePart>): SparePart {
    const parts = this.getParts();
    const idx = parts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Part not found');

    const existing = parts[idx];
    const stockLeft = updates.stockLeft !== undefined ? Number(updates.stockLeft) : existing.stockLeft;
    const minThreshold = updates.minThreshold !== undefined ? Number(updates.minThreshold) : existing.minThreshold;

    let status = updates.status || existing.status;
    if (updates.stockLeft !== undefined || updates.minThreshold !== undefined) {
      if (stockLeft === 0) status = 'critical';
      else if (stockLeft <= minThreshold) status = 'low_stock';
      else status = 'in_stock';
    }

    const updatedPart: SparePart = {
      ...existing,
      ...updates,
      stockLeft,
      minThreshold,
      status,
      lastUpdated: new Date().toISOString(),
    };

    parts[idx] = updatedPart;
    setStored('parts', parts);
    return updatedPart;
  },

  deletePart(id: string): void {
    const parts = this.getParts();
    const filtered = parts.filter(p => p.id !== id);
    setStored('parts', filtered);
  },

  consumeStock(id: string, qty: number, notes: string): SparePart {
    const parts = this.getParts();
    const part = parts.find(p => p.id === id);
    if (!part) throw new Error('Part not found');
    if (part.stockLeft < qty) throw new Error(`Insufficient stock. Only ${part.stockLeft} available.`);

    const newStock = part.stockLeft - qty;
    const updated = this.updatePart(id, { stockLeft: newStock });

    // Record log
    const userStr = localStorage.getItem('robopart_user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Technician' };
    const logs = this.getLogs();
    const newLog: InventoryLog = {
      id: `log-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type: 'consumed',
      quantity: qty,
      performedBy: user.name || 'Technician',
      notes: notes || 'Part consumed for maintenance',
      timestamp: new Date().toISOString(),
    };
    setStored('logs', [newLog, ...logs]);

    return updated;
  },

  restockPart(id: string, qty: number, notes: string): SparePart {
    const parts = this.getParts();
    const part = parts.find(p => p.id === id);
    if (!part) throw new Error('Part not found');

    const newStock = part.stockLeft + qty;
    const updated = this.updatePart(id, { stockLeft: newStock });

    // Record log
    const userStr = localStorage.getItem('robopart_user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Manager' };
    const logs = this.getLogs();
    const newLog: InventoryLog = {
      id: `log-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type: 'restocked',
      quantity: qty,
      performedBy: user.name || 'Manager',
      notes: notes || 'Stock replenishment received',
      timestamp: new Date().toISOString(),
    };
    setStored('logs', [newLog, ...logs]);

    return updated;
  },

  reorderPart(id: string, qty: number): any {
    const parts = this.getParts();
    const part = parts.find(p => p.id === id);
    if (!part) throw new Error('Part not found');

    const userStr = localStorage.getItem('robopart_user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Manager' };
    const orders = this.getReorders();

    const orderNumber = `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: ReorderOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      quantity: qty,
      status: 'pending',
      totalCost: part.unitCost * qty,
      orderedBy: user.name || 'Manager',
      createdAt: new Date().toISOString(),
    };

    setStored('reorders', [newOrder, ...orders]);
    this.updatePart(id, { status: 'reorder_placed' });
    return newOrder;
  },

  getDashboardStats(): DashboardStats {
    const parts = this.getParts();
    const logs = this.getLogs();

    const totalParts = parts.length;
    let totalStockLeft = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    let totalInventoryValue = 0;

    for (const p of parts) {
      totalStockLeft += p.stockLeft || 0;
      totalInventoryValue += (p.stockLeft || 0) * (p.unitCost || 0);
      if (p.status === 'low_stock') lowStockCount++;
      if (p.status === 'critical') criticalCount++;
    }

    const consumedLogs = logs.filter(l => l.type === 'consumed');
    const totalConsumed = consumedLogs.reduce((acc, l) => acc + (l.quantity || 0), 0);

    const orders = this.getReorders();
    const pendingOrdersCount = orders.filter(o => o.status !== 'received').length;

    const alerts = this.getAlerts();
    const activeAlertsCount = alerts.filter(a => !a.isResolved).length;

    // Group by category
    const catMap = new Map<string, { count: number; stock: number; consumed: number }>();
    parts.forEach(p => {
      const cat = p.category || 'General';
      const cur = catMap.get(cat) || { count: 0, stock: 0, consumed: 0 };
      cur.count += 1;
      cur.stock += p.stockLeft;
      catMap.set(cat, cur);
    });

    consumedLogs.forEach(l => {
      const part = parts.find(p => p.id === l.partId);
      const cat = part?.category || 'General';
      const cur = catMap.get(cat) || { count: 0, stock: 0, consumed: 0 };
      cur.consumed += l.quantity;
      catMap.set(cat, cur);
    });

    const categoryDistribution = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      count: val.count,
      stock: val.stock,
      consumed: val.consumed,
    }));

    // Group by status
    const statusMap: Record<string, number> = {
      in_stock: 0,
      low_stock: 0,
      critical: 0,
      reorder_placed: 0,
    };
    parts.forEach(p => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Historical monthly trajectory
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const monthlyUnits = [28, 34, 41, 39, 48, 52];
    const monthlyCost = [24500, 31200, 38400, 35900, 46100, 49800];

    const monthlyConsumption = months.map((m, idx) => ({
      month: m,
      units: monthlyUnits[idx] || 30,
      cost: monthlyCost[idx] || 30000,
    }));

    return {
      totalParts,
      totalStockLeft,
      totalConsumed,
      lowStockCount,
      criticalCount,
      totalInventoryValue,
      pendingOrdersCount,
      activeAlertsCount,
      categoryDistribution,
      statusDistribution,
      monthlyConsumption,
    };
  },

  getCategories(): Category[] {
    return getStored<Category[]>('categories', INITIAL_CATEGORIES);
  },

  createCategory(name: string): Category {
    const cats = this.getCategories();
    const trimmed = name.trim();
    const existing = cats.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [...cats, newCat];
    setStored('categories', updated);
    return newCat;
  },

  getLocations(): LocationItem[] {
    return getStored<LocationItem[]>('locations', INITIAL_LOCATIONS);
  },

  createLocation(name: string): LocationItem {
    const locs = this.getLocations();
    const trimmed = name.trim();
    const existing = locs.find(l => l.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newLoc: LocationItem = {
      id: `loc-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [...locs, newLoc];
    setStored('locations', updated);
    return newLoc;
  },

  getAlerts(): InventoryAlert[] {
    const parts = this.getParts();
    return computeAlerts(parts);
  },

  resolveAlert(id: string): void {
    const alerts = getStored<InventoryAlert[]>('alerts', []);
    const updated = alerts.map(a => a.id === id ? { ...a, isResolved: true } : a);
    if (!alerts.some(a => a.id === id)) {
      updated.push({
        id,
        partId: id.replace(/^alt-(?:crit|low)-/, ''),
        partNumber: '',
        partName: '',
        severity: 'warning',
        title: 'Resolved',
        message: 'Resolved by operator',
        isResolved: true,
        createdAt: new Date().toISOString(),
      });
    }
    setStored('alerts', updated);
  },

  getLogs(partId?: string): InventoryLog[] {
    const logs = getStored<InventoryLog[]>('logs', INITIAL_LOGS);
    if (partId) return logs.filter(l => l.partId === partId);
    return logs;
  },

  getReorders(): ReorderOrder[] {
    return getStored<ReorderOrder[]>('reorders', INITIAL_REORDERS);
  },

  updateOrderStatus(orderId: string, status: string): ReorderOrder {
    const orders = this.getReorders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const validStatus = (['pending', 'approved', 'shipped', 'received'].includes(status)
      ? status
      : 'pending') as 'pending' | 'approved' | 'shipped' | 'received';

    const updated: ReorderOrder = { ...orders[idx], status: validStatus };
    orders[idx] = updated;
    setStored('reorders', orders);

    // If order received, auto restock
    if (validStatus === 'received') {
      try {
        this.restockPart(updated.partId, updated.quantity, `Purchase Order ${updated.orderNumber} delivered & received.`);
      } catch (e) {
        // Ignore restock error if part deleted
      }
    }
    return updated;
  },

  getUsers(): User[] {
    const users = getStored<User[]>('users', INITIAL_USERS);
    return users.map(({ ...u }: any) => {
      delete u.password;
      return u;
    });
  },

  createUser(data: Partial<User> & { password?: string }): User {
    const rawUsers = getStored<(User & { password?: string })[]>('users', INITIAL_USERS);
    const newId = `usr_${Date.now()}`;
    const newUser = {
      id: newId,
      name: data.name || 'New Personnel',
      email: data.email || `user${Date.now()}@toprun.com`,
      password: data.password || 'password123',
      role: data.role || 'technician',
      department: data.department || 'Operations',
      avatar: data.avatar || '',
      createdAt: new Date().toISOString(),
    };
    setStored('users', [...rawUsers, newUser]);
    const { password, ...safeUser } = newUser;
    return safeUser;
  },

  updateUser(id: string, updates: Partial<User>): User {
    const rawUsers = getStored<(User & { password?: string })[]>('users', INITIAL_USERS);
    const idx = rawUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    const updated = { ...rawUsers[idx], ...updates };
    rawUsers[idx] = updated;
    setStored('users', rawUsers);
    const { password, ...safeUser } = updated;
    return safeUser;
  },

  localLogin(email: string, _password?: string): { user: User; token: string } {
    const rawUsers = getStored<(User & { password?: string })[]>('users', INITIAL_USERS);
    const trimmedEmail = email.trim().toLowerCase();
    const found = rawUsers.find(u => u.email.toLowerCase() === trimmedEmail);
    if (found) {
      const { password: _, ...safeUser } = found;
      return { user: safeUser, token: `token_${safeUser.id}` };
    }

    // Fallback role resolution for demo credentials
    let role: UserRole = 'technician';
    if (trimmedEmail.includes('admin')) role = 'admin';
    else if (trimmedEmail.includes('manager')) role = 'manager';
    else if (trimmedEmail.includes('viewer')) role = 'viewer';

    const fallbackUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'Toprun Operator',
      email: email.trim(),
      role,
      department: 'Robotics Engineering',
      avatar: '',
      createdAt: new Date().toISOString(),
    };
    return { user: fallbackUser, token: `token_${fallbackUser.id}` };
  },

  deleteUser(id: string): void {
    const rawUsers = getStored<(User & { password?: string })[]>('users', INITIAL_USERS);
    setStored('users', rawUsers.filter(u => u.id !== id));
  },
};
