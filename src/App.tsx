import React, { useState, useEffect } from 'react';
import { NavTab, Product, Category, Customer, Sale, UserProfile } from './types';
import { BottomNav } from './components/BottomNav';
import { PDVPage } from './pages/PDVPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { MorePage } from './pages/MorePage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeCustomers,
  subscribeSales,
  subscribeUsers,
  getStoredProducts,
  getStoredCategories,
  getStoredCustomers,
  getStoredSales,
  getStoredUsers,
  seedInitialDemoData,
} from './services/firestoreService';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('pdv');
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCustomers());
  const [sales, setSales] = useState<Sale[]>(() => getStoredSales());
  const [users, setUsers] = useState<UserProfile[]>(() => getStoredUsers());
  const [loading, setLoading] = useState(false);

  // Set up real-time listeners for all Firestore collections
  useEffect(() => {
    let unsubscribeProducts = () => {};
    let unsubscribeCategories = () => {};
    let unsubscribeCustomers = () => {};
    let unsubscribeSales = () => {};
    let unsubscribeUsers = () => {};

    // Fallback safety timeout for loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      unsubscribeProducts = subscribeProducts((data) => {
        setProducts(data);
        setLoading(false);
      });

      unsubscribeCategories = subscribeCategories((data) => {
        setCategories(data);
      });

      unsubscribeCustomers = subscribeCustomers((data) => {
        setCustomers(data);
      });

      unsubscribeSales = subscribeSales((data) => {
        setSales(data);
      });

      unsubscribeUsers = subscribeUsers((data) => {
        setUsers(data);
      });
    } catch (err) {
      console.error('Erro na inicialização dos listeners:', err);
      setLoading(false);
    }

    return () => {
      clearTimeout(timer);
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeCustomers();
      unsubscribeSales();
      unsubscribeUsers();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      {/* Current Active View */}
      {(activeTab === 'dashboard' || (activeTab as string) === 'home') && (
        <DashboardPage
          sales={sales}
          products={products}
          onNavigateToInventory={() => setActiveTab('inventory')}
        />
      )}

      {activeTab === 'pdv' && (
        <PDVPage
          products={products}
          categories={categories}
          loading={loading}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryPage
          products={products}
          categories={categories}
          loading={loading}
        />
      )}

      {activeTab === 'sales' && (
        <SalesHistoryPage
          sales={sales}
          loading={loading}
        />
      )}

      {activeTab === 'more' && (
        <MorePage
          customers={customers}
          categories={categories}
          users={users}
        />
      )}

      {/* Persistent Bottom Navigation matching reference layout */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
