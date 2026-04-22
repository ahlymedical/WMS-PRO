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

export interface SaleTransaction {
  id: string;
  tenantId: string;
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
  currency: string; // Stamped currency at time of sale
  timestamp: any;
}

export interface StockTransaction {
  id: string;
  tenantId: string;
  inventoryId: string;
  name: string;
  type: 'in' | 'out';
  quantity: number;
  timestamp: any;
}
