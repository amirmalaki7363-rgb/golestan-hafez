/** Shared client-side types for the account & admin panels. */

export interface OrderItemT {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  image: string;
}

export interface OrderT {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  address: string;
  note: string | null;
  total: number;
  discount: number;
  shipping: number;
  couponCode: string | null;
  status: string;
  createdAt: string;
  items: OrderItemT[];
  user?: { id: string; name: string; phone: string } | null;
}

export interface AddressT {
  id: string;
  title: string;
  city: string;
  detail: string;
  createdAt?: string;
}

export interface ProductT {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  occasion: string;
  price: number;
  comparePrice: number | null;
  image: string;
  badge: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export type AdminProductT = ProductT;

export interface AdminUserT {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

export interface AdminStatsT {
  revenue: number;
  orders: number;
  pending: number;
  users: number;
  products: number;
  lowStock: number;
  outOfStock: number;
  delivered: number;
  cancelled: number;
  discountsGiven: number;
  statusCounts: Record<string, number>;
  /** Last 14 days — [{ day: "MM/DD", orders, revenue }] oldest first. */
  salesSeries: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; sku: string; qty: number; revenue: number }[];
}

export interface AdminRecentOrderT {
  id: string;
  code: string;
  customerName: string;
  total: number;
  discount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

/** Feed of store events shown in the admin "اعلان‌ها" section. */
export interface AdminActivityT {
  recentOrders: {
    id: string;
    code: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
    itemsCount: number;
  }[];
  recentUsers: {
    id: string;
    name: string;
    phone: string;
    role: string;
    createdAt: string;
  }[];
  stockAlerts: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    image: string;
  }[];
  counts: {
    pendingOrders: number;
    newUsers7d: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface CouponT {
  id: string;
  code: string;
  type: "PERCENT" | "AMOUNT";
  value: number;
  minTotal: number;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface SettingsT {
  deliveryFee: number;
  supportPhone: string;
}
