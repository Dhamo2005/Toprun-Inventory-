export type UserRole = 'admin' | 'manager' | 'technician' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface LocationItem {
  id: string;
  name: string;
  createdAt: string;
}

export type PartCategory = string;

export type PartStatus = 'in_stock' | 'low_stock' | 'critical' | 'reorder_placed';

export interface SparePart {
  id: string;
  partNumber: string; // Item number
  name: string;       // Item Name
  description: string;// item Description
  categoryId: string;
  category: string;   // Relational Category Name
  locationId: string;
  location: string;   // Relational Location Name
  minThreshold: number; // minimum threshold
  imageUrl: string;   // Image
  unitCost: number;   // unit price
  stockLeft: number;  // current stock in inventory
  status: PartStatus;
  lastUpdated: string;
}

export interface InventoryLog {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: 'consumed' | 'restocked' | 'reordered' | 'adjusted';
  quantity: number;
  performedBy: string;
  notes: string;
  timestamp: string;
}

export interface InventoryAlert {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface ReorderOrder {
  id: string;
  orderNumber: string;
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  status: 'pending' | 'approved' | 'shipped' | 'received';
  supplier?: string;
  totalCost: number;
  orderedBy: string;
  createdAt: string;
}

export interface DashboardStats {
  totalParts: number;
  totalStockLeft: number;
  totalConsumed: number;
  lowStockCount: number;
  criticalCount: number;
  totalInventoryValue: number;
  pendingOrdersCount: number;
  activeAlertsCount: number;
  categoryDistribution: { category: string; count: number; stock: number; consumed?: number }[];
  statusDistribution: { status: string; count: number }[];
  monthlyConsumption: { month: string; units: number; cost: number }[];
}

export interface FilterOptions {
  search: string;
  category: string;
  location: string;
  status: string;
  sortBy: 'stockLeft' | 'name' | 'unitCost' | 'minThreshold' | 'lastUpdated';
  sortOrder: 'asc' | 'desc';
  onlyNeedOrder: boolean;
}
