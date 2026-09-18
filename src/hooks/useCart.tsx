import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Product, CartItem, Customer } from '../types';
import { safeStorage } from '../utils/storage';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  globalDiscount: number;
  setGlobalDiscount: (discount: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalDiscount: number;
  total: number;
  totalCost: number;
  itemCount: number;
  lastAddedItem: CartItem | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_CUSTOMER: Customer = {
  id: 'cust-balcao',
  name: 'Consumidor Final (Balcão)',
  notes: 'Venda de balcão',
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = safeStorage.getItem('pdv_cart_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && item.product && item.product.id);
        }
      } catch (e) {
        console.error('Error parsing cart:', e);
      }
    }
    return [];
  });

  const [customer, setCustomer] = useState<Customer | null>(() => {
    const saved = safeStorage.getItem('pdv_cart_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing customer:', e);
      }
    }
    return DEFAULT_CUSTOMER;
  });

  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(() => {
    return safeStorage.getItem('pdv_cart_last_added_id') || null;
  });

  useEffect(() => {
    safeStorage.setItem('pdv_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    safeStorage.setItem('pdv_cart_customer', JSON.stringify(customer));
  }, [customer]);

  useEffect(() => {
    if (lastAddedProductId) {
      safeStorage.setItem('pdv_cart_last_added_id', lastAddedProductId);
    } else {
      safeStorage.removeItem('pdv_cart_last_added_id');
    }
  }, [lastAddedProductId]);

  const addItem = (product: Product, quantity = 1) => {
    setLastAddedProductId(product.id);
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: Math.max(0, newQty * updated[existingIndex].unitPrice - updated[existingIndex].discount),
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity,
            unitPrice: product.price,
            discount: 0,
            total: product.price * quantity,
          },
        ];
      }
    });
  };

  const removeItem = (productId: string) => {
    setLastAddedProductId((prev) => (prev === productId ? null : prev));
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setLastAddedProductId(productId);
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
            total: Math.max(0, quantity * item.unitPrice - item.discount),
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validDiscount = Math.max(0, Math.min(item.quantity * item.unitPrice, discount));
          return {
            ...item,
            discount: validDiscount,
            total: Math.max(0, item.quantity * item.unitPrice - validDiscount),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setGlobalDiscount(0);
    setCustomer(DEFAULT_CUSTOMER);
    setLastAddedProductId(null);
    safeStorage.removeItem('pdv_cart_items');
    safeStorage.removeItem('pdv_cart_last_added_id');
  };

  const validItems = Array.isArray(items) ? items : [];
  const subtotal = validItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0), 0);
  const itemsDiscount = validItems.reduce((sum, item) => sum + (Number(item?.discount) || 0), 0);
  const totalDiscount = itemsDiscount + (Number(globalDiscount) || 0);
  const total = Math.max(0, subtotal - totalDiscount);
  const totalCost = validItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.product?.costPrice) || 0), 0);
  const itemCount = validItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

  const lastAddedItem = useMemo(() => {
    if (items.length === 0) return null;
    if (lastAddedProductId) {
      const found = items.find((item) => item.product.id === lastAddedProductId);
      if (found) return found;
    }
    return items[items.length - 1] || null;
  }, [items, lastAddedProductId]);

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        setCustomer,
        addItem,
        removeItem,
        updateQuantity,
        updateItemDiscount,
        globalDiscount,
        setGlobalDiscount,
        clearCart,
        subtotal,
        totalDiscount,
        total,
        totalCost,
        itemCount,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
