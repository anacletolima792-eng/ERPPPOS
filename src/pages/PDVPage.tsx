import React, { useState, useMemo } from 'react';
import { Search, Barcode, LayoutGrid, List, Filter, PackageX, Sparkles, ChevronDown } from 'lucide-react';
import { Product, Category, Sale } from '../types';
import { Header } from '../components/Header';
import { ActionBanner } from '../components/ActionBanner';
import { ProductCard } from '../components/ProductCard';
import { CartDrawerModal } from '../components/CartDrawerModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { OperatorSwitchModal } from '../components/OperatorSwitchModal';
import { CustomerSelectModal } from '../components/CustomerSelectModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { seedInitialDemoData } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';

interface PDVPageProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
}

export const PDVPage: React.FC<PDVPageProps> = ({ products, categories, loading }) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter products by search term (name, code, barcode) and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const name = (p.name || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        code.includes(term) ||
        barcode.includes(term);

      const matchesCategory =
        selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId]);

  const handleSaleCompleted = (sale: Sale) => {
    setCompletedSale(sale);
    setIsReceiptOpen(true);
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      await seedInitialDemoData();
    } catch (err) {
      console.error('Erro ao popular dados:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden pb-16 sm:pb-20 transition-colors">
      {/* Fixed Top Controls Section */}
      <div className="shrink-0 bg-slate-50 dark:bg-slate-950 z-20 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
        {/* Top Header */}
        <Header
          onOpenOperatorModal={() => setIsOperatorModalOpen(true)}
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        />

        {/* Prominent Action Banner */}
        <ActionBanner
          onOpenCart={() => setIsCartOpen(true)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />

        {/* Search, Scanner, View Toggle & Category Dropdown */}
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-2 pb-2.5 flex flex-col gap-2">
          {/* Controls Bar: Search & Action Icons on the SAME line */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                id="input-pdv-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, código ou bipar..."
                className="w-full bg-white dark:bg-slate-900 sm:bg-slate-100 dark:sm:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 sm:pl-10 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Barcode Scanner Button */}
              <button
                type="button"
                id="btn-open-barcode"
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer h-9 w-9 sm:w-auto sm:px-3"
                title="Leitor de Código de Barras"
              >
                <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
                <span className="hidden md:inline">Scanner</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs h-9">
                <button
                  type="button"
                  id="btn-view-list"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Visualização em Lista"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="btn-view-grid"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Dropdown Filter */}
          <CategoryDropdown
            categories={categories}
            products={products}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>
      </div>

      {/* Scrollable Products Area */}
      <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-2.5 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carregando catálogo do Firestore...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-4 space-y-3 shadow-xs">
            <PackageX className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nenhum produto encontrado</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `Nenhum resultado para "${searchTerm}". Tente outro termo ou código.`
                  : 'O banco de dados ainda não possui produtos cadastrados.'}
              </p>
            </div>

            {products.length === 0 && (
              <button
                type="button"
                id="btn-seed-empty-pdv"
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSeeding ? 'Criando dados de exemplo...' : 'Criar Produtos de Demonstração'}</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pb-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 pb-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenCustomerSelect={() => setIsCustomerModalOpen(true)}
        onReturnCompleted={handleSaleCompleted}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleComplete={handleSaleCompleted}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={completedSale}
        onClose={() => setIsReceiptOpen(false)}
      />

      <OperatorSwitchModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
      />

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        products={products}
        onClose={() => setIsScannerOpen(false)}
      />

      <ProductFormModal
        isOpen={isProductFormOpen}
        categories={categories}
        onClose={() => setIsProductFormOpen(false)}
      />
    </div>
  );
};
