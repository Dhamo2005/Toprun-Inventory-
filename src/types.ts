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

export type PartCategory =
  | 'Actuators & Motors'
  | 'Sensors & Vision'
  | 'End Effectors & Grippers'
  | 'Compute & Control Boards'
  | 'Power & Battery Systems'
  | 'Cables & Connectors'
  | 'Pneumatics & Hydraulics'
  | 'Structural & Mechanical';

export type PartStatus = 'in_stock' | 'low_stock' | 'critical' | 'reorder_placed';

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  category: PartCategory;
  robotModel: string;
  description: string;
  imageUrl: string;
  stockLeft: number;
  minThreshold: number;
  consumed: number;
  needToOrder: number;
  unitCost: number;
  unit?: string;
  supplier: string;
  leadTimeDays: number;
  location: string;
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
  supplier: string;
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
  categoryDistribution: { category: string; count: number; stock: number; consumed: number }[];
  statusDistribution: { status: string; count: number }[];
  monthlyConsumption: { month: string; units: number; cost: number }[];
}

export interface FilterOptions {
  search: string;
  category: string;
  robotModel: string;
  status: string;
  sortBy: 'stockLeft' | 'consumed' | 'needToOrder' | 'name' | 'unitCost';
  sortOrder: 'asc' | 'desc';
  onlyNeedOrder: boolean;
}
