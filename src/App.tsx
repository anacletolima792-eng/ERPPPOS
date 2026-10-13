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
import { ThemeProvider } from './hooks/useTheme';
import { PrintReceiptView } from './components/PrintReceiptView';
import { AuthScreen } from './components/AuthScreen';
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
} from './services/firestoreService';

const MainApp: React.FC = () => {
  const { isAdmin, companyId } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('pdv');
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCustomers());
  const [sales, setSales] = useState<Sale[]>(() => getStoredSales());
  const [users, setUsers] = useState<UserProfile[]>(() => getStoredUsers());
  const [loading, setLoading] = useState(false);

  // Se o operador logado for vendedor/não-admin, permite estritamente as abas PDV, Estoque e Vendas
  useEffect(() => {
    if (!isAdmin && activeTab !== 'pdv' && activeTab !== 'inventory' && activeTab !== 'sales') {
      setActiveTab('pdv');
    }
  }, [isAdmin, activeTab]);

  // Set up real-time listeners for all Firestore collections whenever companyId changes
  useEffect(() => {
    if (!companyId) return;

    // Refresh state synchronously with newly scoped store
    setProducts(getStoredProducts());
    setCategories(getStoredCategories());
    setCustomers(getStoredCustomers());
    setSales(getStoredSales());
    setUsers(getStoredUsers());

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
  }, [companyId]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 select-none transition-colors">
      {/* Current Active View */}
      {isAdmin && (activeTab === 'dashboard' || (activeTab as string) === 'home') && (
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

      {isAdmin && activeTab === 'more' && (
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

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-800 dark:text-slate-200">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold tracking-wide animate-pulse">Carregando ambiente seguro da empresa...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainApp />;
};

export function App() {
  const [printSaleId, setPrintSaleId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('printSale');
      } catch {}
    }
    return null;
  });

  if (printSaleId) {
    return (
      <PrintReceiptView
        saleId={printSaleId}
        onClose={() => {
          try {
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } catch {}
          setPrintSaleId(null);
        }}
      />
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
