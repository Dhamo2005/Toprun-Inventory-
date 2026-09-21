import { SparePart, PartCategory, User, InventoryAlert, InventoryLog, ReorderOrder, DashboardStats } from '../types.ts';

const STORAGE_KEYS = {
  PARTS: 'toprun_local_parts',
  USERS: 'toprun_local_users',
  ALERTS: 'toprun_local_alerts',
  LOGS: 'toprun_local_logs',
  ORDERS: 'toprun_local_orders',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Dr. Elena Vance',
    email: 'admin@toprun.com',
    role: 'admin',
    department: 'Robotics Engineering & Operations',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'usr_manager',
    name: 'Marcus Reyes',
    email: 'manager@toprun.com',
    role: 'manager',
    department: 'Inventory & Procurement',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-12T09:30:00.000Z'
  },
  {
    id: 'usr_tech',
    name: 'Alex Mercer',
    email: 'tech@toprun.com',
    role: 'technician',
    department: 'Field Maintenance & Assembly',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-15T11:00:00.000Z'
  },
  {
    id: 'usr_viewer',
    name: 'Sarah Jenkins',
    email: 'viewer@toprun.com',
    role: 'viewer',
    department: 'Audit & Safety Compliance',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-20T14:15:00.000Z'
  }
];

const INITIAL_PARTS: SparePart[] = [
  {
    id: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    name: 'Harmonic Drive Strain Wave Reducer',
    category: 'Actuators & Motors',
    robotModel: 'Universal UR10e',
    description: 'Zero-backlash precision gear assembly for joint 2 & 3 rotation, 80:1 ratio with cross-roller bearing.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    stockLeft: 2,
    minThreshold: 5,
    consumed: 18,
    needToOrder: 8,
    unitCost: 1450.00,
    supplier: 'Harmonic Drive LLC',
    leadTimeDays: 14,
    location: 'Aisle 2, Bin M-04',
    status: 'critical',
    unit: 'pcs',
    lastUpdated: '2025-02-14T09:12:00.000Z'
  },
  {
    id: 'prt-002',
    partNumber: 'MXN-ECI-40',
    name: 'Maxon EC-i 40 100W Brushless Servo Motor',
    category: 'Actuators & Motors',
    robotModel: 'Boston Dynamics Spot',
    description: 'High-torque brushless DC motor with hall sensors and digital incremental encoder for robotic quadrupeds.',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
    stockLeft: 4,
    minThreshold: 6,
    consumed: 24,
    needToOrder: 6,
    unitCost: 820.00,
    supplier: 'Maxon Precision Motors',
    leadTimeDays: 10,
    location: 'Rack 1, Shelf B-2',
    status: 'low_stock',
    unit: 'pcs',
    lastUpdated: '2025-02-16T11:45:00.000Z'
  },
  {
    id: 'prt-003',
    partNumber: 'ROBQ-2F-85',
    name: 'Robotiq 2F-85 Adaptive Electric Gripper',
    category: 'End Effectors & Grippers',
    robotModel: 'Universal UR10e',
    description: 'Programmable dual-finger collaborative gripper with 85mm stroke, force feedback and quick coupling.',
    imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80',
    stockLeft: 7,
    minThreshold: 4,
    consumed: 9,
    needToOrder: 0,
    unitCost: 3600.00,
    supplier: 'Robotiq Inc.',
    leadTimeDays: 7,
    location: 'Cabinet C, Drawer 1',
    status: 'in_stock',
    unit: 'pcs',
    lastUpdated: '2025-02-17T16:20:00.000Z'
  },
  {
    id: 'prt-004',
    partNumber: 'INT-RS-D435I',
    name: 'Intel RealSense D435i Depth Camera Module',
    category: 'Sensors & Vision',
    robotModel: 'Autonomous Mobile Robot (AMR)',
    description: 'Active stereo depth perception with integrated IMU for SLAM navigation and obstacle avoidance.',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80',
    stockLeft: 1,
    minThreshold: 6,
    consumed: 22,
    needToOrder: 9,
    unitCost: 495.00,
    supplier: 'Intel Vision Systems',
    leadTimeDays: 5,
    location: 'Optics Lab, Shelf O-1',
    status: 'critical',
    unit: 'pcs',
    lastUpdated: '2025-02-18T10:05:00.000Z'
  }
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
    timestamp: '2025-02-14T09:12:00.000Z'
  }
];

const INITIAL_ALERTS: InventoryAlert[] = [
  {
    id: 'alt-001',
    partId: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    partName: 'Harmonic Drive Strain Wave Reducer',
    severity: 'critical',
    title: 'Critical Low Stock (2 Left)',
    message: 'Stock has fallen to 2 units (threshold is 5). Lead time is 14 days.',
    isResolved: false,
    createdAt: '2025-02-14T09:15:00.000Z'
  },
  {
    id: 'alt-002',
    partId: 'prt-004',
    partNumber: 'INT-RS-D435I',
    partName: 'Intel RealSense D435i Depth Camera Module',
    severity: 'critical',
    title: 'Critical Low Stock (1 Left)',
    message: 'Stock has fallen to 1 unit (threshold is 6). Order 9 units recommended.',
    isResolved: false,
    createdAt: '2025-02-18T10:06:00.000Z'
  }
];

const INITIAL_ORDERS: ReorderOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'PO-2025-001',
    partId: 'prt-001',
    partNumber: 'HD-CSG-20-80',
    partName: 'Harmonic Drive Strain Wave Reducer',
    quantity: 8,
    status: 'approved',
    supplier: 'Harmonic Drive LLC',
    totalCost: 11600.00,
    orderedBy: 'Dr. Elena Vance (Admin)',
    createdAt: '2025-02-15T10:00:00.000Z'
  }
];

function getStored<T>(key: string, initial: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(val);
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export const localStore = {
  login(email: string, password?: string): { user: User; token: string } {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalized = email.trim().toLowerCase();
    
    // Support @toprun.com and alias
    const user = users.find(u => 
      u.email.toLowerCase() === normalized ||
      u.email.toLowerCase().replace('@toprun.com', '@robopart.com') === normalized ||
      u.email.toLowerCase().replace('@robopart.com', '@toprun.com') === normalized
    );

    if (!user) {
      // If user not found, but it's admin@toprun.com, return admin
      if (normalized.startsWith('admin@')) {
        return { user: INITIAL_USERS[0], token: INITIAL_USERS[0].id };
      }
      throw new Error('User with this email not found');
    }

    // Accept password123 or any non-empty password
    if (password && password !== 'password123' && password !== 'password') {
      throw new Error('Invalid or missing password');
    }

    return { user, token: user.id };
  },

  getParts(params?: {
    search?: string;
    category?: string;
    status?: string;
    robotModel?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }): SparePart[] {
    let parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);

    if (params?.search) {
      const q = params.search.toLowerCase();
      parts = parts.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.robotModel.toLowerCase().includes(q)
      );
    }

    if (params?.category && params.category !== 'all') {
      parts = parts.filter(p => p.category === params.category);
    }

    if (params?.status && params.status !== 'all') {
      parts = parts.filter(p => p.status === params.status);
    }

    if (params?.robotModel && params.robotModel !== 'all') {
      parts = parts.filter(p => p.robotModel === params.robotModel);
    }

    return parts;
  },

  createPart(data: Partial<SparePart>): SparePart {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const id = `prt-${Date.now()}`;
    const stockLeft = data.stockLeft || 0;
    const minThreshold = data.minThreshold || 5;

    let status: SparePart['status'] = 'in_stock';
    if (stockLeft === 0) status = 'critical';
    else if (stockLeft <= minThreshold) status = 'low_stock';

    const newPart: SparePart = {
      id,
      partNumber: data.partNumber || `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name || 'New Item',
      category: (data.category as PartCategory) || 'Actuators & Motors',
      robotModel: data.robotModel || 'General Equipment',
      description: data.description || '',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      stockLeft,
      minThreshold,
      consumed: 0,
      needToOrder: Math.max(0, minThreshold - stockLeft),
      unitCost: data.unitCost || 100,
      supplier: data.supplier || 'Standard Supplier',
      leadTimeDays: data.leadTimeDays || 7,
      location: data.location || 'Bin A-1',
      status,
      unit: data.unit || 'pcs',
      lastUpdated: new Date().toISOString()
    };

    parts.unshift(newPart);
    setStored(STORAGE_KEYS.PARTS, parts);
    return newPart;
  },

  updatePart(id: string, data: Partial<SparePart>): SparePart {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const idx = parts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Item not found');

    const cur = parts[idx];
    const stockLeft = data.stockLeft !== undefined ? data.stockLeft : cur.stockLeft;
    const minThreshold = data.minThreshold !== undefined ? data.minThreshold : cur.minThreshold;

    let status: SparePart['status'] = cur.status;
    if (stockLeft === 0) status = 'critical';
    else if (stockLeft <= minThreshold) status = 'low_stock';
    else status = 'in_stock';

    const updated: SparePart = {
      ...cur,
      ...data,
      stockLeft,
      minThreshold,
      status,
      needToOrder: Math.max(0, minThreshold - stockLeft),
      lastUpdated: new Date().toISOString()
    };

    parts[idx] = updated;
    setStored(STORAGE_KEYS.PARTS, parts);
    return updated;
  },

  deletePart(id: string): void {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const filtered = parts.filter(p => p.id !== id);
    setStored(STORAGE_KEYS.PARTS, filtered);
  },

  consumeStock(id: string, quantity: number, notes: string): SparePart {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const idx = parts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Item not found');

    const cur = parts[idx];
    if (cur.stockLeft < quantity) {
      throw new Error(`Insufficient stock. Only ${cur.stockLeft} available.`);
    }

    const newStock = cur.stockLeft - quantity;
    let status: SparePart['status'] = 'in_stock';
    if (newStock === 0) status = 'critical';
    else if (newStock <= cur.minThreshold) status = 'low_stock';

    const updated: SparePart = {
      ...cur,
      stockLeft: newStock,
      consumed: cur.consumed + quantity,
      needToOrder: Math.max(0, cur.minThreshold - newStock),
      status,
      lastUpdated: new Date().toISOString()
    };

    parts[idx] = updated;
    setStored(STORAGE_KEYS.PARTS, parts);

    // Log the usage
    const logs = getStored<InventoryLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    logs.unshift({
      id: `log-${Date.now()}`,
      partId: cur.id,
      partNumber: cur.partNumber,
      partName: cur.name,
      type: 'consumed',
      quantity,
      performedBy: 'Dr. Elena Vance (Admin)',
      notes,
      timestamp: new Date().toISOString()
    });
    setStored(STORAGE_KEYS.LOGS, logs);

    return updated;
  },

  restockPart(id: string, quantity: number, notes: string): SparePart {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const idx = parts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Item not found');

    const cur = parts[idx];
    const newStock = cur.stockLeft + quantity;
    let status: SparePart['status'] = 'in_stock';
    if (newStock <= cur.minThreshold) status = 'low_stock';

    const updated: SparePart = {
      ...cur,
      stockLeft: newStock,
      needToOrder: Math.max(0, cur.minThreshold - newStock),
      status,
      lastUpdated: new Date().toISOString()
    };

    parts[idx] = updated;
    setStored(STORAGE_KEYS.PARTS, parts);

    // Log the restock
    const logs = getStored<InventoryLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    logs.unshift({
      id: `log-${Date.now()}`,
      partId: cur.id,
      partNumber: cur.partNumber,
      partName: cur.name,
      type: 'restocked',
      quantity,
      performedBy: 'Dr. Elena Vance (Admin)',
      notes,
      timestamp: new Date().toISOString()
    });
    setStored(STORAGE_KEYS.LOGS, logs);

    return updated;
  },

  getAlerts(): InventoryAlert[] {
    return getStored<InventoryAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  },

  resolveAlert(id: string): void {
    const alerts = getStored<InventoryAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
    const updated = alerts.map(a => a.id === id ? { ...a, isResolved: true } : a);
    setStored(STORAGE_KEYS.ALERTS, updated);
  },

  getLogs(): InventoryLog[] {
    return getStored<InventoryLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  },

  getOrders(): ReorderOrder[] {
    return getStored<ReorderOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  createOrder(data: { partId: string; quantity: number }): ReorderOrder {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const part = parts.find(p => p.id === data.partId);
    if (!part) throw new Error('Item not found');

    const order: ReorderOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      quantity: data.quantity,
      status: 'pending',
      supplier: part.supplier,
      totalCost: part.unitCost * data.quantity,
      orderedBy: 'Dr. Elena Vance (Admin)',
      createdAt: new Date().toISOString()
    };

    const orders = getStored<ReorderOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    orders.unshift(order);
    setStored(STORAGE_KEYS.ORDERS, orders);
    return order;
  },

  updateOrderStatus(id: string, status: ReorderOrder['status']): ReorderOrder {
    const orders = getStored<ReorderOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    orders[idx] = { ...orders[idx], status };
    setStored(STORAGE_KEYS.ORDERS, orders);
    return orders[idx];
  },

  getStats(): DashboardStats {
    const parts = getStored<SparePart[]>(STORAGE_KEYS.PARTS, INITIAL_PARTS);
    const orders = getStored<ReorderOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

    const totalParts = parts.length;
    const criticalCount = parts.filter(p => p.status === 'critical').length;
    const lowStockCount = parts.filter(p => p.status === 'low_stock').length;
    const totalStockLeft = parts.reduce((sum, p) => sum + p.stockLeft, 0);
    const totalConsumed = parts.reduce((sum, p) => sum + p.consumed, 0);
    const totalInventoryValue = parts.reduce((sum, p) => sum + (p.stockLeft * p.unitCost), 0);
    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

    const catMap: Record<string, { count: number; stock: number; consumed: number }> = {};
    for (const p of parts) {
      if (!catMap[p.category]) {
        catMap[p.category] = { count: 0, stock: 0, consumed: 0 };
      }
      catMap[p.category].count += 1;
      catMap[p.category].stock += p.stockLeft;
      catMap[p.category].consumed += p.consumed;
    }
    const categoryDistribution = Object.entries(catMap).map(([category, d]) => ({
      category,
      count: d.count,
      stock: d.stock,
      consumed: d.consumed
    }));

    const statusMap: Record<string, number> = {};
    for (const p of parts) {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count
    }));

    return {
      totalParts,
      totalStockLeft,
      totalConsumed,
      lowStockCount,
      criticalCount,
      totalInventoryValue,
      pendingOrdersCount,
      categoryDistribution,
      statusDistribution,
      monthlyConsumption: [
        { month: 'Jan', units: 14, cost: 12500 },
        { month: 'Feb', units: 28, cost: 24800 },
        { month: 'Mar', units: 19, cost: 16200 }
      ]
    };
  },

  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  createUser(data: Partial<User>): User {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name || 'New User',
      email: data.email || `user${Date.now()}@toprun.com`,
      role: data.role || 'viewer',
      department: data.department || 'Operations',
      avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  updateUser(id: string, data: Partial<User>): User {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data };
    setStored(STORAGE_KEYS.USERS, users);
    return users[idx];
  },

  deleteUser(id: string): void {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
  }
};
