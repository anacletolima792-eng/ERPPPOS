import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Category, Customer, Sale, Quote, QuoteStatus, UserProfile, StoreSettings, CartItem, PaymentMethod } from '../types';
import { safeStorage } from '../utils/storage';

// ==================== STORAGE KEYS & EVENT SYSTEM ====================
export const STORAGE_KEYS = {
  PRODUCTS: 'erp_pdv_persisted_products',
  CATEGORIES: 'erp_pdv_persisted_categories',
  CUSTOMERS: 'erp_pdv_persisted_customers',
  SALES: 'erp_pdv_persisted_sales',
  QUOTES: 'erp_pdv_persisted_quotes',
  USERS: 'erp_pdv_persisted_users',
  SETTINGS: 'erp_pdv_persisted_settings',
};

const notifyLocalDataChange = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('pdv_local_sync_event', {
          detail: { key, data },
        })
      );
    } catch {}
  }
};

export const getStoredData = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = safeStorage.getItem(key);
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed)) return parsed as unknown as T;
      } else if (parsed && typeof parsed === 'object') {
        return { ...fallback, ...parsed };
      }
    }
  } catch (err) {
    console.warn(`Erro ao ler storage para ${key}:`, err);
  }
  return fallback;
};

export const setStoredData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    safeStorage.setItem(key, JSON.stringify(data));
    notifyLocalDataChange(key, data);
  } catch (err) {
    console.warn(`Erro ao salvar storage para ${key}:`, err);
  }
};

// Auto-clean any old demo seed from browser local storage once
if (typeof window !== 'undefined') {
  try {
    const WIPE_KEY = 'erp_pdv_demo_wiped_v2';
    if (!safeStorage.getItem(WIPE_KEY)) {
      safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      safeStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      safeStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      safeStorage.removeItem(STORAGE_KEYS.SALES);
      safeStorage.removeItem(STORAGE_KEYS.USERS);
      safeStorage.removeItem('pdv_cart_items');
      safeStorage.removeItem('pdv_current_user');
      safeStorage.setItem(WIPE_KEY, 'true');
    }
  } catch {}
}

// ==================== INITIAL CLEAN DATA ====================
export const DEFAULT_CATEGORIES: Category[] = [];

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-balcao',
    name: 'Consumidor Final (Balcão)',
    phone: '',
    email: '',
    document: '',
    notes: 'Cliente padrão para vendas rápidas no balcão',
  },
];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Administrador',
    email: 'admin@sistema.com',
    role: 'admin',
    active: true,
    pin: '1234',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Meu Estabelecimento',
  cnpj: '',
  phone: '',
  address: '',
  pixKey: '',
  pixKeyType: 'random',
  receiptFooter: 'Obrigado pela preferência! Volte sempre.',
};

export const DEFAULT_SALES: Sale[] = [];
export const DEFAULT_QUOTES: Quote[] = [];

// Read initial stored values synchronously
export const normalizeProduct = (p: any, fallbackIndex = 0): Product => ({
  id: p.id || `prod-${Date.now()}-${fallbackIndex}`,
  name: p.name || 'Produto',
  code: p.code || `#${(10001 + fallbackIndex).toString()}`,
  barcode: p.barcode || '',
  categoryId: p.categoryId || '',
  categoryName: p.categoryName || '',
  price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
  costPrice: typeof p.costPrice === 'number' ? p.costPrice : Number(p.costPrice) || 0,
  stock: typeof p.stock === 'number' ? p.stock : Number(p.stock) || 0,
  minStock: typeof p.minStock === 'number' ? p.minStock : Number(p.minStock) || 5,
  unit: p.unit || 'UN',
  imageUrl: p.imageUrl || '',
  createdAt: p.createdAt || new Date().toISOString(),
  updatedAt: p.updatedAt || new Date().toISOString(),
});

export const getStoredProducts = (): Product[] => {
  const list = getStoredData(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  return (Array.isArray(list) ? list : []).map((p, idx) => normalizeProduct(p, idx));
};
export const getStoredCategories = (): Category[] => {
  const list = getStoredData(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  return Array.isArray(list) ? list : [];
};
export const getStoredCustomers = (): Customer[] => {
  const list = getStoredData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  return Array.isArray(list) ? list : DEFAULT_CUSTOMERS;
};
export const getStoredSales = (): Sale[] => {
  const list = getStoredData(STORAGE_KEYS.SALES, DEFAULT_SALES);
  return Array.isArray(list) ? list : [];
};
export const getStoredQuotes = (): Quote[] => {
  const list = getStoredData(STORAGE_KEYS.QUOTES, DEFAULT_QUOTES);
  return Array.isArray(list) ? list : [];
};
export const getStoredUsers = (): UserProfile[] => {
  const list = getStoredData(STORAGE_KEYS.USERS, DEFAULT_USERS);
  return Array.isArray(list) ? list : DEFAULT_USERS;
};
export const getStoredSettings = (): StoreSettings => getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);

// Helper to clean objects for Firestore
export const cleanFirestoreData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestoreData(item)).filter((item) => item !== undefined);
  }

  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = cleanFirestoreData(val);
    }
  }
  return result;
};

// ==================== PRODUCTS ====================
export const subscribeProducts = (callback: (products: Product[]) => void) => {
  // Immediately provide cached data for 0ms initial render
  const initial = getStoredProducts();
  callback(initial);

  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('name', 'asc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProducts: Product[] = [];
        let idx = 0;
        snapshot.forEach((docSnap) => {
          firestoreProducts.push(normalizeProduct({ id: docSnap.id, ...docSnap.data() }, idx++));
        });
        setStoredData(STORAGE_KEYS.PRODUCTS, firestoreProducts);
        callback(firestoreProducts);
      } else {
        const local = getStoredProducts();
        callback(local);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar produtos no Firestore (usando cache local):', error);
      callback(getStoredProducts());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.PRODUCTS) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cleanData = cleanFirestoreData({
    id: newId,
    ...productData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 1. Update local storage immediately
  const current = getStoredProducts();
  const updated = [cleanData, ...current.filter((p) => p.id !== newId)];
  setStoredData(STORAGE_KEYS.PRODUCTS, updated);

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, 'products', newId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Aviso ao salvar produto no Firestore:', err);
  }

  return newId;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
  const current = getStoredProducts();
  const existing = current.find((p) => p.id === id);
  const updatedItem: Product = {
    ...(existing || ({} as Product)),
    ...productData,
    id,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = current.map((p) => (p.id === id ? updatedItem : p));
  setStoredData(STORAGE_KEYS.PRODUCTS, updatedList);

  try {
    const docRef = doc(db, 'products', id);
    await setDoc(docRef, cleanFirestoreData(updatedItem), { merge: true });
  } catch (err) {
    console.warn('Aviso ao atualizar produto no Firestore:', err);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== id);
  setStoredData(STORAGE_KEYS.PRODUCTS, updated);

  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Aviso ao deletar produto no Firestore:', err);
  }
};

export const adjustProductStock = async (id: string, delta: number): Promise<void> => {
  const current = getStoredProducts();
  const updated = current.map((p) => {
    if (p.id === id) {
      return { ...p, stock: Math.max(0, (p.stock || 0) + delta), updatedAt: new Date().toISOString() };
    }
    return p;
  });
  setStoredData(STORAGE_KEYS.PRODUCTS, updated);

  try {
    const docRef = doc(db, 'products', id);
    const productDoc = await getDoc(docRef);
    if (productDoc.exists()) {
      const cur = productDoc.data().stock || 0;
      await setDoc(docRef, { stock: Math.max(0, cur + delta), updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    console.warn('Aviso ao ajustar estoque no Firestore:', err);
  }
};

// ==================== CATEGORIES ====================
export const subscribeCategories = (callback: (categories: Category[]) => void) => {
  callback(getStoredCategories());

  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('name', 'asc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Category[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        setStoredData(STORAGE_KEYS.CATEGORIES, list);
        callback(list);
      } else {
        const local = getStoredCategories();
        callback(local);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar categorias:', error);
      callback(getStoredCategories());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.CATEGORIES) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<string> => {
  const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cleanData = cleanFirestoreData({
    id: newId,
    ...categoryData,
    createdAt: new Date().toISOString(),
  });

  const current = getStoredCategories();
  setStoredData(STORAGE_KEYS.CATEGORIES, [...current, cleanData]);

  try {
    const docRef = doc(db, 'categories', newId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Aviso ao salvar categoria:', err);
  }

  return newId;
};

export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<void> => {
  const current = getStoredCategories();
  const updated = current.map((c) => (c.id === id ? { ...c, ...categoryData, id } : c));
  setStoredData(STORAGE_KEYS.CATEGORIES, updated);

  try {
    const docRef = doc(db, 'categories', id);
    await setDoc(docRef, cleanFirestoreData(categoryData), { merge: true });
  } catch (err) {
    console.warn('Aviso ao atualizar categoria:', err);
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  const current = getStoredCategories();
  setStoredData(STORAGE_KEYS.CATEGORIES, current.filter((c) => c.id !== id));

  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Aviso ao deletar categoria:', err);
  }
};

// ==================== CUSTOMERS ====================
export const subscribeCustomers = (callback: (customers: Customer[]) => void) => {
  callback(getStoredCustomers());

  const customersRef = collection(db, 'customers');
  const q = query(customersRef, orderBy('name', 'asc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
        });
        setStoredData(STORAGE_KEYS.CUSTOMERS, list);
        callback(list);
      } else {
        const local = getStoredCustomers();
        callback(local);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar clientes:', error);
      callback(getStoredCustomers());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.CUSTOMERS) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const createCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
  const newId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cleanData = cleanFirestoreData({
    id: newId,
    ...customerData,
    createdAt: new Date().toISOString(),
  });

  const current = getStoredCustomers();
  setStoredData(STORAGE_KEYS.CUSTOMERS, [cleanData, ...current]);

  try {
    const docRef = doc(db, 'customers', newId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Aviso ao salvar cliente:', err);
  }

  return newId;
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<void> => {
  const current = getStoredCustomers();
  const updated = current.map((c) => (c.id === id ? { ...c, ...customerData, id } : c));
  setStoredData(STORAGE_KEYS.CUSTOMERS, updated);

  try {
    const docRef = doc(db, 'customers', id);
    await setDoc(docRef, cleanFirestoreData(customerData), { merge: true });
  } catch (err) {
    console.warn('Aviso ao atualizar cliente:', err);
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const current = getStoredCustomers();
  setStoredData(STORAGE_KEYS.CUSTOMERS, current.filter((c) => c.id !== id));

  try {
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Aviso ao excluir cliente:', err);
  }
};

// ==================== SALES ====================
export const subscribeSales = (callback: (sales: Sale[]) => void) => {
  callback(getStoredSales());

  const salesRef = collection(db, 'sales');
  const q = query(salesRef, orderBy('createdAt', 'desc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Sale[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Sale);
        });
        setStoredData(STORAGE_KEYS.SALES, list);
        callback(list);
      } else {
        const local = getStoredSales();
        if (local.length > 0) {
          callback(local);
        }
      }
    },
    (error) => {
      console.warn('Aviso ao escutar vendas:', error);
      callback(getStoredSales());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.SALES) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const subscribeQuotes = (callback: (quotes: Quote[]) => void) => {
  callback(getStoredQuotes());

  const colRef = collection(db, 'quotes');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      try {
        const list: Quote[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Quote);
        });

        const local = getStoredQuotes();
        const mergedMap = new Map<string, Quote>();
        local.forEach((item) => mergedMap.set(item.id, item));
        list.forEach((item) => mergedMap.set(item.id, item));

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setStoredData(STORAGE_KEYS.QUOTES, merged);
        callback(merged);
      } catch (err) {
        console.warn('Erro ao processar snapshot de orçamentos:', err);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar orçamentos:', error);
      callback(getStoredQuotes());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.QUOTES) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const saveQuoteTransaction = async (
  quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>
): Promise<Quote> => {
  const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const quoteNumber = `ORC-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();

  const fullQuote: Quote = cleanFirestoreData({
    id: quoteId,
    quoteNumber,
    ...quoteData,
    createdAt,
  });

  // 1. Add to local quotes immediately
  const currentQuotes = getStoredQuotes();
  setStoredData(STORAGE_KEYS.QUOTES, [fullQuote, ...currentQuotes]);

  // 2. Sync to Firestore in non-blocking race
  const syncToCloud = async () => {
    try {
      const qRef = doc(db, 'quotes', quoteId);
      await setDoc(qRef, fullQuote, { merge: true });
    } catch (err) {
      console.warn('Aviso ao registrar orçamento no Firestore:', err);
    }
  };

  await Promise.race([
    syncToCloud(),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);

  return fullQuote;
};

export const updateQuoteStatus = async (
  quoteId: string,
  status: QuoteStatus,
  convertedSaleId?: string
): Promise<void> => {
  const currentQuotes = getStoredQuotes();
  const updatedAt = new Date().toISOString();
  const updatedQuotes = currentQuotes.map((q) => {
    if (q.id === quoteId) {
      return {
        ...q,
        status,
        convertedSaleId: convertedSaleId || q.convertedSaleId,
        convertedAt: status === 'converted' ? updatedAt : q.convertedAt,
        updatedAt,
      };
    }
    return q;
  });

  setStoredData(STORAGE_KEYS.QUOTES, updatedQuotes);

  try {
    const qRef = doc(db, 'quotes', quoteId);
    const updateData: any = { status, updatedAt };
    if (convertedSaleId) updateData.convertedSaleId = convertedSaleId;
    if (status === 'converted') updateData.convertedAt = updatedAt;
    await updateDoc(qRef, updateData);
  } catch (err) {
    console.warn('Aviso ao atualizar status de orçamento no Firestore:', err);
  }
};

export const deleteQuote = async (quoteId: string): Promise<void> => {
  const currentQuotes = getStoredQuotes();
  setStoredData(
    STORAGE_KEYS.QUOTES,
    currentQuotes.filter((q) => q.id !== quoteId)
  );

  try {
    const qRef = doc(db, 'quotes', quoteId);
    await deleteDoc(qRef);
  } catch (err) {
    console.warn('Aviso ao excluir orçamento do Firestore:', err);
  }
};

export const processSaleTransaction = async (saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>): Promise<Sale> => {
  const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const saleNumber = `VD-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();

  const fullSale: Sale = cleanFirestoreData({
    id: saleId,
    saleNumber,
    ...saleData,
    createdAt,
  });

  // 1. Add to local sales immediately
  const currentSales = getStoredSales();
  setStoredData(STORAGE_KEYS.SALES, [fullSale, ...currentSales]);

  // 2. Decrement local product stock immediately
  const currentProducts = getStoredProducts();
  const updatedProducts = currentProducts.map((p) => {
    const saleItem = saleData.items.find((i) => i.productId === p.id);
    if (saleItem) {
      return {
        ...p,
        stock: Math.max(0, (p.stock || 0) - saleItem.quantity),
        updatedAt: createdAt,
      };
    }
    return p;
  });
  setStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);

  // 3. Sync to Firestore in background/fast race (never block POS transaction)
  const syncToCloud = async () => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      await setDoc(saleRef, fullSale, { merge: true });

      for (const item of saleData.items) {
        if (!item.productId) continue;
        const pRef = doc(db, 'products', item.productId);
        updateDoc(pRef, {
          stock: increment(-item.quantity),
          updatedAt: createdAt,
        }).catch((err) => console.warn('Stock update warning:', err));
      }
    } catch (err) {
      console.warn('Aviso ao registrar venda no Firestore:', err);
    }
  };

  // Wait max 500ms for cloud confirmation, then continue immediately so cashier is never blocked
  await Promise.race([
    syncToCloud(),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);

  return fullSale;
};

export const cancelSale = async (sale: Sale, canceledBy: string, reason?: string): Promise<void> => {
  if (sale.status === 'canceled') return;

  const updatedAt = new Date().toISOString();

  // 1. Update local sale status
  const currentSales = getStoredSales();
  const updatedSales = currentSales.map((s) => {
    if (s.id === sale.id) {
      return {
        ...s,
        status: 'canceled' as const,
        canceledAt: updatedAt,
        canceledBy,
        cancelReason: reason || 'Cancelamento solicitado pelo operador',
      };
    }
    return s;
  });
  setStoredData(STORAGE_KEYS.SALES, updatedSales);

  // 2. Restore stock locally
  const currentProducts = getStoredProducts();
  const updatedProducts = currentProducts.map((p) => {
    const saleItem = sale.items.find((i) => i.productId === p.id);
    if (saleItem) {
      return {
        ...p,
        stock: (p.stock || 0) + saleItem.quantity,
        updatedAt,
      };
    }
    return p;
  });
  setStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);

  // 3. Firestore batch update (fast/non-blocking)
  const syncCancelToCloud = async () => {
    try {
      const saleRef = doc(db, 'sales', sale.id);
      await setDoc(
        saleRef,
        {
          status: 'canceled',
          canceledAt: updatedAt,
          canceledBy,
          cancelReason: reason || 'Cancelamento solicitado pelo operador',
        },
        { merge: true }
      );

      for (const item of sale.items) {
        if (!item.productId) continue;
        const pRef = doc(db, 'products', item.productId);
        updateDoc(pRef, {
          stock: increment(item.quantity),
          updatedAt,
        }).catch((err) => console.warn('Stock restore warning:', err));
      }
    } catch (err) {
      console.warn('Aviso ao cancelar venda no Firestore:', err);
    }
  };

  await Promise.race([
    syncCancelToCloud(),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);
};

export const processReturnTransaction = async (returnData: {
  operatorId: string;
  operatorName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  returnReason?: string;
  notes?: string;
}): Promise<Sale> => {
  const saleId = `return-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const saleNumber = `DEV-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();

  const fullReturn: Sale = cleanFirestoreData({
    id: saleId,
    saleNumber,
    operatorId: returnData.operatorId,
    operatorName: returnData.operatorName,
    customerId: returnData.customerId,
    customerName: returnData.customerName || 'Consumidor Final (Balcão)',
    items: returnData.items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      productCode: i.product.code,
      quantity: i.quantity,
      unit: i.product.unit || 'UN',
      unitPrice: i.unitPrice,
      costPrice: i.product.costPrice || 0,
      discount: i.discount || 0,
      total: i.total,
    })),
    subtotal: returnData.subtotal,
    discount: 0,
    total: returnData.total,
    totalCost: returnData.items.reduce((sum, i) => sum + (i.product.costPrice || 0) * i.quantity, 0),
    paymentMethod: returnData.paymentMethod,
    amountPaid: returnData.total,
    change: 0,
    notes: returnData.notes || (returnData.returnReason ? `Motivo: ${returnData.returnReason}` : 'Devolução de produtos ao estoque'),
    status: 'returned' as const,
    returnReason: returnData.returnReason || 'Devolução solicitada pelo cliente',
    returnedAt: createdAt,
    returnedBy: returnData.operatorName,
    createdAt,
  });

  // 1. Add to local sales immediately
  const currentSales = getStoredSales();
  setStoredData(STORAGE_KEYS.SALES, [fullReturn, ...currentSales]);

  // 2. INCREMENT product stock locally immediately
  const currentProducts = getStoredProducts();
  const updatedProducts = currentProducts.map((p) => {
    const returnedItem = returnData.items.find((i) => i.product.id === p.id);
    if (returnedItem) {
      return {
        ...p,
        stock: (p.stock || 0) + returnedItem.quantity,
        updatedAt: createdAt,
      };
    }
    return p;
  });
  setStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);

  // 3. Sync to Firestore in background / fast race
  const syncReturnToCloud = async () => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      await setDoc(saleRef, fullReturn, { merge: true });

      for (const item of returnData.items) {
        if (!item.product.id) continue;
        const pRef = doc(db, 'products', item.product.id);
        updateDoc(pRef, {
          stock: increment(item.quantity),
          updatedAt: createdAt,
        }).catch((err) => console.warn('Stock increment on return warning:', err));
      }
    } catch (err) {
      console.warn('Aviso ao registrar devolução no Firestore:', err);
    }
  };

  await Promise.race([
    syncReturnToCloud(),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);

  return fullReturn;
};

// ==================== USERS ====================
export const subscribeUsers = (callback: (users: UserProfile[]) => void) => {
  callback(getStoredUsers());

  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('name', 'asc'));

  const unsubFirestore = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setStoredData(STORAGE_KEYS.USERS, list);
        callback(list);
      } else {
        const local = getStoredUsers();
        callback(local);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar usuários:', error);
      callback(getStoredUsers());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.USERS) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const saveUserProfile = async (user: UserProfile): Promise<void> => {
  const current = getStoredUsers();
  const exists = current.some((u) => u.id === user.id);
  const updated = exists ? current.map((u) => (u.id === user.id ? user : u)) : [...current, user];
  setStoredData(STORAGE_KEYS.USERS, updated);

  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, cleanFirestoreData(user), { merge: true });
  } catch (err) {
    console.warn('Aviso ao salvar usuário:', err);
  }
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>): Promise<void> => {
  const current = getStoredUsers();
  const updated = current.map((u) => (u.id === id ? { ...u, ...updates, id } : u));
  setStoredData(STORAGE_KEYS.USERS, updated);

  try {
    const userRef = doc(db, 'users', id);
    await setDoc(userRef, cleanFirestoreData(updates), { merge: true });
  } catch (err) {
    console.warn('Aviso ao atualizar usuário:', err);
  }
};

export const deleteUserProfile = async (id: string): Promise<void> => {
  const current = getStoredUsers();
  setStoredData(STORAGE_KEYS.USERS, current.filter((u) => u.id !== id));

  try {
    const userRef = doc(db, 'users', id);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('Aviso ao excluir usuário:', err);
  }
};

// ==================== STORE SETTINGS ====================
export const subscribeStoreSettings = (callback: (settings: StoreSettings) => void) => {
  callback(getStoredSettings());

  const settingsRef = doc(db, 'settings', 'store');
  const unsubFirestore = onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) {
        const merged = { ...DEFAULT_STORE_SETTINGS, ...(snap.data() as StoreSettings) };
        setStoredData(STORAGE_KEYS.SETTINGS, merged);
        callback(merged);
      } else {
        const local = getStoredSettings();
        callback(local);
      }
    },
    (error) => {
      console.warn('Aviso ao escutar configurações:', error);
      callback(getStoredSettings());
    }
  );

  const localHandler = (e: any) => {
    if (e.detail?.key === STORAGE_KEYS.SETTINGS) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('pdv_local_sync_event', localHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener('pdv_local_sync_event', localHandler);
  };
};

export const getStoreSettings = async (): Promise<StoreSettings> => {
  return getStoredSettings();
};

export const saveStoreSettings = async (settings: StoreSettings): Promise<void> => {
  const merged = { ...getStoredSettings(), ...settings };
  setStoredData(STORAGE_KEYS.SETTINGS, merged);

  try {
    const settingsRef = doc(db, 'settings', 'store');
    await setDoc(settingsRef, cleanFirestoreData(settings), { merge: true });
  } catch (err) {
    console.warn('Aviso ao salvar configurações:', err);
  }
};

// ==================== CLEAR ALL DATABASE DATA ====================
export const clearAllDatabaseData = async (options?: {
  includeProducts?: boolean;
  includeSales?: boolean;
  includeCustomers?: boolean;
  includeCategories?: boolean;
}): Promise<{ deletedCounts: { products: number; sales: number; customers: number; categories: number } }> => {
  const {
    includeProducts = true,
    includeSales = true,
    includeCustomers = true,
    includeCategories = true,
  } = options || {};

  const deletedCounts = { products: 0, sales: 0, customers: 0, categories: 0 };

  if (includeProducts) {
    deletedCounts.products = getStoredProducts().length;
    setStoredData(STORAGE_KEYS.PRODUCTS, []);
  }
  if (includeSales) {
    deletedCounts.sales = getStoredSales().length;
    setStoredData(STORAGE_KEYS.SALES, []);
    setStoredData(STORAGE_KEYS.QUOTES, []);
  }
  if (includeCustomers) {
    deletedCounts.customers = getStoredCustomers().length;
    setStoredData(STORAGE_KEYS.CUSTOMERS, []);
  }
  if (includeCategories) {
    deletedCounts.categories = getStoredCategories().length;
    setStoredData(STORAGE_KEYS.CATEGORIES, []);
  }

  // Clear Firestore collections
  const clearCollection = async (name: string) => {
    try {
      const snap = await getDocs(collection(db, name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn(`Aviso ao limpar ${name}:`, e);
    }
  };

  if (includeProducts) await clearCollection('products');
  if (includeSales) {
    await clearCollection('sales');
    await clearCollection('quotes');
  }
  if (includeCustomers) await clearCollection('customers');
  if (includeCategories) await clearCollection('categories');

  try {
    localStorage.removeItem('pdv_cart_items');
    localStorage.removeItem('pdv_current_discount');
    localStorage.removeItem('pdv_applied_customer_id');
  } catch (e) {}

  return { deletedCounts };
};

// ==================== SEED INITIAL DEMO DATA ====================
export const seedInitialDemoData = async (): Promise<{
  productsCount: number;
  categoriesCount: number;
  customersCount: number;
}> => {
  setStoredData(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  setStoredData(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  setStoredData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  setStoredData(STORAGE_KEYS.USERS, DEFAULT_USERS);
  setStoredData(STORAGE_KEYS.SALES, DEFAULT_SALES);
  setStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);

  try {
    const batch = writeBatch(db);

    for (const cat of DEFAULT_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.id), cleanFirestoreData(cat), { merge: true });
    }
    for (const prod of DEFAULT_PRODUCTS) {
      batch.set(doc(db, 'products', prod.id), cleanFirestoreData(prod), { merge: true });
    }
    for (const cust of DEFAULT_CUSTOMERS) {
      batch.set(doc(db, 'customers', cust.id), cleanFirestoreData(cust), { merge: true });
    }
    for (const user of DEFAULT_USERS) {
      batch.set(doc(db, 'users', user.id), cleanFirestoreData(user), { merge: true });
    }
    for (const sale of DEFAULT_SALES) {
      batch.set(doc(db, 'sales', sale.id), cleanFirestoreData(sale), { merge: true });
    }

    await batch.commit();
  } catch (err) {
    console.warn('Aviso ao sincronizar seed demo com Firestore:', err);
  }

  return {
    productsCount: DEFAULT_PRODUCTS.length,
    categoriesCount: DEFAULT_CATEGORIES.length,
    customersCount: DEFAULT_CUSTOMERS.length,
  };
};
