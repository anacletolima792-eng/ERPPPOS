import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  Barcode,
  ScanLine,
  ZoomIn,
} from 'lucide-react';
import { Product, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { adjustProductStock, deleteProduct } from '../services/firestoreService';
import { ProductFormModal } from '../components/ProductFormModal';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuantityStepper } from '../components/QuantityStepper';
import { ProductImageZoomModal } from '../components/ProductImageZoomModal';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';

interface InventoryPageProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ products, categories, loading }) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCameraSearchOpen, setIsCameraSearchOpen] = useState(false);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);

  // Filter products
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

      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

      const matchesLowStock = !filterLowStockOnly || p.stock <= p.minStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, selectedCategory, filterLowStockOnly]);

  // Inventory Totals
  const totalStockItems = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const totalSaleValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.price, 0);
  }, [products]);

  const totalCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * (p.costPrice || 0), 0);
  }, [products]);

  const handleQuickStock = async (product: Product, delta: number) => {
    try {
      await adjustProductStock(product.id, delta);
    } catch (err) {
      console.error('Erro ao ajustar estoque:', err);
    }
  };

  const handleSetStock = async (product: Product, newStock: number) => {
    try {
      const delta = newStock - product.stock;
      if (delta !== 0) {
        await adjustProductStock(product.id, delta);
      }
    } catch (err) {
      console.error('Erro ao ajustar estoque:', err);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeletingProduct(true);
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Código', 'Nome', 'Categoria', 'Preço Venda (R$)', 'Preço Custo (R$)', 'Estoque', 'Estoque Mínimo', 'Unidade', 'Código de Barras'];
    const rows = products.map((p) => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.categoryName || '').replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      (p.costPrice || 0).toFixed(2),
      p.stock,
      p.minStock,
      p.unit || 'UN',
      `"${p.barcode || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estoque_produtos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col pb-24 transition-colors">
      {/* Fixed Top Section: Header + 4 Cards (no gap) + Search Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-xs space-y-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Controle de Estoque</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Catálogo completo de produtos, precificação e reposição</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="p-2 sm:px-3 sm:py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              title="Exportar CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                id="btn-add-product-inventory"
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </button>
            )}

            <div className="shrink-0 ml-1">
              <ThemeToggle id="inventory-theme-toggle" />
            </div>
          </div>
        </div>

        {/* Inventory KPI Summary - Connected with NO space between cards */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-50/50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200 dark:divide-slate-800 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight block truncate">
                Total de Produtos
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-tight block">
                {products.length} itens
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight block truncate">
                Valor em Estoque
              </span>
              <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 leading-tight block">
                {formatCurrency(totalSaleValue)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight block truncate">
                Custo Total do Estoque
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 leading-tight block">
                {isAdmin ? formatCurrency(totalCostValue) : '***'}
              </span>
            </div>

            <div
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 cursor-pointer transition-colors ${
                filterLowStockOnly
                  ? 'bg-orange-100/90 dark:bg-orange-950/80 text-orange-950 dark:text-orange-200 font-bold'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
              title="Clique para filtrar itens com estoque baixo"
            >
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight block truncate">
                Estoque Baixo
              </span>
              <span className="text-sm sm:text-base font-black text-orange-700 dark:text-orange-400 leading-tight block">
                {products.filter((p) => p.stock <= p.minStock).length} itens
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              id="input-inventory-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, código ou código de barras..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-12 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />

            <button
              type="button"
              id="btn-inventory-scan-barcode"
              onClick={() => setIsCameraSearchOpen(true)}
              title="Escanear código de barras com a câmera"
              className="absolute right-1.5 p-1.5 bg-white dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-slate-600 text-orange-600 dark:text-orange-400 rounded-md border border-slate-200 dark:border-slate-600 hover:border-orange-300 shadow-2xs transition-colors cursor-pointer"
            >
              <Barcode className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
        {/* Products Table / Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <Package className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ajuste os filtros de busca para visualizar os itens.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={(e) => {
                          if (p.imageUrl) {
                            e.stopPropagation();
                            setZoomedProduct(p);
                          }
                        }}
                        className={`w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative group/img ${
                          p.imageUrl ? 'cursor-zoom-in hover:ring-2 hover:ring-orange-400' : ''
                        }`}
                        title={p.imageUrl ? 'Clique para ampliar a foto' : undefined}
                      >
                        {p.imageUrl ? (
                          <>
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                            />
                            {/* Zoom hint on hover */}
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </>
                        ) : (
                          <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase truncate">
                            {p.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {p.code}
                          </span>
                          {p.categoryName && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                              {p.categoryName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs mt-1 text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>
                            Venda: <strong className="text-blue-600 dark:text-blue-400 font-black">{formatCurrency(p.price)}</strong> / {p.unit || 'UN'}
                          </span>
                          {isAdmin && p.costPrice > 0 && (
                            <>
                              <span>Custo: {formatCurrency(p.costPrice)}</span>
                              <span
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                                  p.price - p.costPrice >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                Lucro: {formatCurrency(p.price - p.costPrice)} (
                                {p.price > 0
                                  ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1)
                                  : 0}
                                %)
                              </span>
                            </>
                          )}
                          {p.barcode && <span className="font-mono text-[11px]">EAN: {p.barcode}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Stock status & quick adjustments */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Stock Counter with QuantityStepper */}
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <div className="flex flex-col items-center">
                            <QuantityStepper
                              id={`stepper-inv-${p.id}`}
                              value={p.stock}
                              onChange={(newStock) => handleSetStock(p, newStock)}
                              min={0}
                              size="sm"
                              colorScheme="blue"
                              unit={p.unit || 'UN'}
                            />
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                              {isOutOfStock ? 'Esgotado' : isLowStock ? 'Mín: ' + p.minStock : 'Estoque'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-center px-1">
                            <span
                              className={`text-xs font-black block leading-none ${
                                isOutOfStock
                                  ? 'text-red-600 dark:text-red-400'
                                  : isLowStock
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {p.stock} {p.unit || 'UN'}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                              {isOutOfStock ? 'Esgotado' : isLowStock ? 'Mín: ' + p.minStock : 'Estoque'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Edit & Delete Buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            id={`btn-edit-prod-${p.id}`}
                            onClick={() => {
                              setEditingProduct(p);
                              setIsFormOpen(true);
                            }}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600 cursor-pointer shadow-2xs"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-prod-${p.id}`}
                            onClick={() => setProductToDelete(p)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-600 cursor-pointer shadow-2xs"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={editingProduct}
        categories={categories}
      />

      {/* Camera Barcode Scanner for Inventory Lookup */}
      <CameraBarcodeScannerModal
        isOpen={isCameraSearchOpen}
        onClose={() => setIsCameraSearchOpen(false)}
        onScan={(scanned) => {
          setSearchTerm(scanned);
        }}
        title="Buscar Produto no Estoque"
        subtitle="Aponte a câmera para o código de barras para localizar o produto no catálogo"
      />

      {/* Confirmation Modal for Direct Delete */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Excluir Produto"
        message="Tem certeza de que deseja remover permanentemente este produto do estoque?"
        itemName={productToDelete ? `${productToDelete.name} (${productToDelete.code})` : undefined}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeletingProduct}
        onConfirm={handleConfirmDeleteProduct}
        onClose={() => setProductToDelete(null)}
      />

      {/* Product Image Zoom Modal */}
      {zoomedProduct && zoomedProduct.imageUrl && (
        <ProductImageZoomModal
          isOpen={Boolean(zoomedProduct)}
          onClose={() => setZoomedProduct(null)}
          imageUrl={zoomedProduct.imageUrl}
          productName={zoomedProduct.name}
          productCode={zoomedProduct.code}
          productPrice={zoomedProduct.price}
          productStock={zoomedProduct.stock}
          productUnit={zoomedProduct.unit}
          categoryName={zoomedProduct.categoryName}
        />
      )}
    </div>
  );
};
