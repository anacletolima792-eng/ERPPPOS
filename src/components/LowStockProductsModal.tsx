import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Search,
  Package,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Barcode,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Product, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { filterProductsSemantically } from '../utils/semanticSearch';
import { adjustProductStock } from '../services/firestoreService';
import { QuantityStepper } from './QuantityStepper';
import { ProductFormModal } from './ProductFormModal';
import { useAuth } from '../hooks/useAuth';

interface LowStockProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories?: Category[];
  onOpenFullInventory?: () => void;
}

export const LowStockProductsModal: React.FC<LowStockProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  categories = [],
  onOpenFullInventory,
}) => {
  const { isAdmin, isAuthenticated, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'out_of_stock' | 'low_stock'>('out_of_stock');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // All critical products: stock <= minStock
  const allCriticalProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  // Out of stock count vs low stock count
  const outOfStockCount = useMemo(() => {
    return allCriticalProducts.filter((p) => p.stock <= 0).length;
  }, [allCriticalProducts]);

  const lowStockCount = useMemo(() => {
    return allCriticalProducts.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  }, [allCriticalProducts]);

  // Filtered list by search and sub-filter
  const displayedProducts = useMemo(() => {
    let list = allCriticalProducts;

    if (filterType === 'out_of_stock') {
      list = list.filter((p) => p.stock <= 0);
    } else if (filterType === 'low_stock') {
      list = list.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    }

    if (!searchTerm.trim()) {
      return list.sort((a, b) => a.stock - b.stock);
    }

    const filtered = filterProductsSemantically(list, searchTerm);
    return filtered.sort((a, b) => a.stock - b.stock);
  }, [allCriticalProducts, filterType, searchTerm]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-white dark:from-orange-950/50 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Produtos em Estoque Crítico
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-500 text-white shadow-2xs">
                  {allCriticalProducts.length} {allCriticalProducts.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Produtos esgotados ou com quantidade abaixo ou igual ao estoque mínimo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullInventory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullInventory();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
                title="Abrir tela completa de Estoque"
              >
                <span>Ir para Estoque Geral</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            <button
              type="button"
              id="btn-close-critical-stock"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header: Search & Filter Pills */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              id="input-search-critical-stock"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, código ou código de barras..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-9 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-0.5 sm:pb-0">

            <button
              type="button"
              onClick={() => setFilterType('out_of_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'out_of_stock'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Esgotados ({outOfStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('low_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'low_stock'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Abaixo do Mínimo ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4 space-y-2">
          {displayedProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 stroke-1.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                  {allCriticalProducts.length === 0
                    ? 'Nenhum produto em estoque crítico!'
                    : 'Nenhum produto encontrado com este filtro.'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {allCriticalProducts.length === 0
                    ? 'Excelente! Todos os itens do catálogo estão com estoque saudável e acima do estoque mínimo estipulado.'
                    : 'Tente alterar os termos de busca ou mudar a aba de filtro acima.'}
                </p>
              </div>
            </div>
          ) : (
            displayedProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const diffToMin = Math.max(0, p.minStock - p.stock);

              return (
                <div
                  key={p.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isOutOfStock
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:border-red-300'
                      : 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/60 hover:border-orange-300'
                  }`}
                >
                  {/* Left: Product Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Image Column with Product Code badge directly above it */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 leading-none mb-1 shadow-2xs">
                        {p.code}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400 stroke-1.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {p.name}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white tracking-wider">
                            Esgotado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-white tracking-wider">
                            Crítico
                          </span>
                        )}
                        {p.categoryName && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                            {p.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex-wrap">
                        <span>Preço: <strong className="text-slate-800 dark:text-slate-100">{formatCurrency(p.price)}</strong></span>
                        {p.costPrice !== undefined && p.costPrice > 0 && (
                          <span>Custo: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(p.costPrice)}</strong></span>
                        )}
                        {p.barcode && <span className="font-mono text-[11px]">EAN: {p.barcode}</span>}
                      </div>

                      {/* Reposition Suggestion Info */}
                      <div className="mt-1.5 text-xs flex items-center gap-2">
                        <span className="text-orange-900 dark:text-orange-300 font-bold bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span>Mínimo definido:</span>
                          <strong>{p.minStock} {p.unit || 'UN'}</strong>
                        </span>
                        {diffToMin > 0 && (
                          <span className="text-red-700 dark:text-red-300 font-bold text-[11px]">
                            (Faltam pelo menos +{diffToMin} {p.unit || 'UN'} para atingir o mínimo)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Stock Reposition Stepper & Edit */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Ajustar Estoque
                      </span>
                      <QuantityStepper
                        id={`critical-stepper-${p.id}`}
                        value={p.stock}
                        onChange={(newVal) => handleSetStock(p, newVal)}
                        min={0}
                        size="md"
                        colorScheme="orange"
                        unit={p.unit || 'UN'}
                      />
                    </div>

                    {(isAdmin || isAuthenticated || !!currentUser) && (
                      <button
                        type="button"
                        id={`btn-edit-critical-prod-${p.id}`}
                        onClick={() => {
                          setEditingProduct(p);
                          setIsFormOpen(true);
                        }}
                        className="p-2 sm:px-3 sm:py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Editar cadastro completo do produto"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <strong>{displayedProducts.length}</strong> de <strong>{allCriticalProducts.length}</strong> itens críticos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Modal de Edição de Produto */}
        {isFormOpen && (
          <ProductFormModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
            }}
            productToEdit={editingProduct}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
};
