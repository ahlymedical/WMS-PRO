export interface Tenant {
  id: string;
  email: string;
  name: string;
  currency: string;
  pendingCurrency?: string;
  status: 'pending' | 'approved' | 'rejected';

  // White-labeling / Business Settings
  businessDisplayName?: string;
  supportPhone?: string;
  supportEmail?: string;

  createdAt: any;
  updatedAt: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  category: string;
  supplier: string;
  cost: number;
  salePrice: number;
  stock: number;
  minAlert: number;
  tenantId: string;
}

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier';

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string; // 6-digit hashed or plain pin depending on security reqs
  phone?: string;
  isActive: boolean;
  createdAt: any;
}

export interface SaleTransaction {
  id: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  status: 'completed' | 'refunded' | 'held';
  paymentMethod: 'cash' | 'card' | 'credit';
  items: {
    inventoryId: string;
    name: string;
    quantity: number;
    salePrice: number;
    cost: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountTendered?: number;
  changeDue?: number;
  currency: string; // Stamped currency at time of sale
  timestamp: any;
  refundReason?: string;
  refundApprovedBy?: string; // ID of manager who approved
}

export interface ShiftSummary {
  id: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  startTime: any;
  endTime: any | null;
  startingCash: number;
  expectedCash: number;
  actualCash: number;
  cardTotals: number;
  refundTotals: number;
  status: 'open' | 'closed';
}

export interface StockTransaction {
  id: string;
  tenantId: string;
  inventoryId: string;
  name: string;
  type: 'in' | 'out';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  timestamp: any;
}

export interface Backup {
  id: string;
  tenantId: string;
  name: string;
  dataPayload: string; // JSON string of collections
  timestamp: any;
  sizeBytes: number;
}

export interface DeletedUserHistory {
  id?: string;
  tenantId: string;
  email: string;
  name: string;
  reason: string;
  action: 'deleted' | 'archived';
  timestamp: any;
}
