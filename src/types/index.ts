export type UserRole = 'admin' | 'vendedor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  pin?: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string; // UN, KG, CX, MT, LT, PCT
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  document?: string; // CPF or CNPJ
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
  createdAt?: string;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'prazo';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // in R$
  total: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
}

export type SaleStatus = 'completed' | 'canceled' | 'returned';

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'converted' | 'expired';

export interface Quote {
  id: string;
  quoteNumber: string;
  operatorId: string;
  operatorName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerDocument?: string;
  customerEmail?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod | string;
  validUntil: string;
  notes?: string;
  status: QuoteStatus;
  convertedSaleId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  operatorId: string;
  operatorName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  notes?: string;
  status: SaleStatus;
  returnReason?: string;
  returnedAt?: string;
  returnedBy?: string;
  canceledAt?: string;
  canceledBy?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  receiptFooter?: string;
}

export type NavTab = 'dashboard' | 'pdv' | 'inventory' | 'sales' | 'more';
