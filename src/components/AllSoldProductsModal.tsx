import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, Sale } from '../types';
import { formatCurrency } from '../utils/formatters';
import { DateFilterBar } from './DateFilterBar';
import { DateFilterConfig } from './DateFilterModal';
import { filterSalesByDate, getDateFilterLabel } from '../utils/dateFilter';

interface AllSoldProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  allSales?: Sale[];
  products: Product[];
  periodLabel: string;
  isAdmin?: boolean;
  currentFilter?: DateFilterConfig;
  onFilterChange?: (filter: DateFilterConfig) => void;
}

interface SoldProductItem {
  id: string;
  name: string;
  code: string;
  categoryName: string;
  quantity: number;
  unit: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  averagePrice: number;
  salesCount: number;
  revenueShare: number;
  volumeShare: number;
}

export const AllSoldProductsModal: React.FC<AllSoldProductsModalProps> = ({
  isOpen,
  onClose,
  sales,
  allSales,
  products,
  periodLabel,
  isAdmin = true,
  currentFilter,
  onFilterChange,
}) => {
  const [localFilter, setLocalFilter] = useState<DateFilterConfig>({ type: 'today' });
  const effectiveFilter = currentFilter || localFilter;
  const handleFilterChange = onFilterChange || setLocalFilter;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue' | 'profit' | 'name'>('quantity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active sales based on date filter
  const activeSales = useMemo(() => {
    if (allSales && allSales.length > 0) {
      return filterSalesByDate(
        allSales.filter((s) => s.status !== 'canceled'),
        effectiveFilter
      );
    }
    return sales;
  }, [allSales, sales, effectiveFilter]);

  const effectivePeriodLabel = currentFilter || (allSales && allSales.length > 0)
    ? getDateFilterLabel(effectiveFilter)
    : periodLabel;

  // Map products metadata for quick lookups
  const productMetaMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      map.set(p.id, p);
      if (p.name) map.set(p.name.toLowerCase().trim(), p);
    });
    return map;
  }, [products]);

  // Aggregate all sold items
  const aggregatedProducts = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      code: string;
      categoryName: string;
      quantity: number;
      unit: string;
      revenue: number;
      cost: number;
      salesCount: number;
    }>();

    let grandTotalRevenue = 0;
    let grandTotalQuantity = 0;

    activeSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = (item.productId ? productMetaMap.get(item.productId) : null) ||
                     productMetaMap.get((item.productName || '').toLowerCase().trim());

        const key = item.productId || prod?.id || item.productName;
        const name = item.productName || prod?.name || 'Produto sem nome';
        const code = prod?.code || prod?.barcode || '-';
        const categoryName = prod?.categoryName || 'Sem Categoria';
        const unit = prod?.unit || 'un';

        const itemCostPrice = prod?.costPrice || 0;
        const lineCost = itemCostPrice * item.quantity;

        grandTotalRevenue += item.total;
        grandTotalQuantity += item.quantity;

        const current = map.get(key) || {
          id: key,
          name,
          code,
          categoryName,
          quantity: 0,
          unit,
          revenue: 0,
          cost: 0,
          salesCount: 0,
        };

        current.quantity += item.quantity;
        current.revenue += item.total;
        current.cost += lineCost;
        current.salesCount += 1;

        map.set(key, current);
      });
    });

    const result: SoldProductItem[] = [];

    map.forEach((val) => {
      const profit = val.revenue - val.cost;
      const margin = val.revenue > 0 ? (profit / val.revenue) * 100 : 0;
      const averagePrice = val.quantity > 0 ? val.revenue / val.quantity : 0;
      const revenueShare = grandTotalRevenue > 0 ? (val.revenue / grandTotalRevenue) * 100 : 0;
      const volumeShare = grandTotalQuantity > 0 ? (val.quantity / grandTotalQuantity) * 100 : 0;

      result.push({
        ...val,
        profit,
        margin,
        averagePrice,
        revenueShare,
        volumeShare,
      });
    });

    return {
      items: result,
      grandTotalRevenue,
      grandTotalQuantity,
    };
  }, [sales, productMetaMap]);

  // Unique categories for filtering
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    aggregatedProducts.items.forEach((item) => set.add(item.categoryName));
    return Array.from(set).sort();
  }, [aggregatedProducts.items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let list = aggregatedProducts.items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || item.categoryName === selectedCategory;

      return matchesSearch && matchesCat;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quantity') {
        comparison = b.quantity - a.quantity;
      } else if (sortBy === 'revenue') {
        comparison = b.revenue - a.revenue;
      } else if (sortBy === 'profit') {
        comparison = b.profit - a.profit;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }

      return sortDirection === 'desc' ? comparison : -comparison;
    });

    return list;
  }, [aggregatedProducts.items, searchTerm, selectedCategory, sortBy, sortDirection]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedItems.length === 0) return;

    const headers = [
      'Posição',
      'Produto',
      'Código',
      'Categoria',
      'Qtd Vendida',
      'Unidade',
      'Preço Médio',
      'Faturamento (R$)',
      '% do Faturamento',
      ...(isAdmin ? ['Custo (R$)', 'Lucro (R$)', 'Margem (%)'] : []),
    ];

    const rows = filteredAndSortedItems.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.code}"`,
      `"${item.categoryName}"`,
      item.quantity.toString().replace('.', ','),
      item.unit,
      item.averagePrice.toFixed(2).replace('.', ','),
      item.revenue.toFixed(2).replace('.', ','),
      `${item.revenueShare.toFixed(1)}%`.replace('.', ','),
      ...(isAdmin
        ? [
            item.cost.toFixed(2).replace('.', ','),
            item.profit.toFixed(2).replace('.', ','),
            `${item.margin.toFixed(1)}%`.replace('.', ','),
          ]
        : []),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `produtos_vendidos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="modal-all-sold-products"
        className="bg-white w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header - Compact Single Row */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-xs sm:text-base font-black text-slate-900 leading-none truncate">
                Produtos Vendidos
              </h2>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                {effectivePeriodLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <DateFilterBar
              currentFilter={effectiveFilter}
              onFilterChange={handleFilterChange}
              alignPopover="right"
              compact={true}
            />
            <button
              type="button"
              id="btn-close-all-sold-products"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters - Compact & Efficient */}
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-b border-slate-100 flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-sold-products"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-6 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            {categoriesList.length > 1 && (
              <select
                id="select-category-filter-sold"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 max-w-[150px] truncate"
              >
                <option value="all">Categorias ({categoriesList.length})</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sort & Export Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold border border-slate-200 h-8">
              <button
                type="button"
                id="btn-sort-quantity"
                onClick={() => {
                  if (sortBy === 'quantity') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('quantity');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 text-[11px] ${
                  sortBy === 'quantity'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Volume</span>
                {sortBy === 'quantity' && (
                  <ArrowUpDown className="w-2.5 h-2.5 text-blue-600" />
                )}
              </button>

              <button
                type="button"
                id="btn-sort-revenue"
                onClick={() => {
                  if (sortBy === 'revenue') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('revenue');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 text-[11px] ${
                  sortBy === 'revenue'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Faturamento</span>
                {sortBy === 'revenue' && (
                  <ArrowUpDown className="w-2.5 h-2.5 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                id="btn-sort-name"
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortBy('name');
                    setSortDirection('asc');
                  }
                }}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 text-[11px] ${
                  sortBy === 'name'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>A-Z</span>
                {sortBy === 'name' && (
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />
                )}
              </button>
            </div>

            <button
              type="button"
              id="btn-export-sold-csv"
              onClick={handleExportCSV}
              disabled={filteredAndSortedItems.length === 0}
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Exportar para planilha Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Content List / Table */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          {filteredAndSortedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1.5">
              <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs sm:text-sm font-bold text-slate-600">Nenhum produto encontrado</p>
              <p className="text-[11px] text-slate-400">
                {searchTerm
                  ? 'Tente remover o termo da busca ou alterar a categoria selecionada.'
                  : 'Nenhuma venda registrada no período selecionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAndSortedItems.map((item) => (
                <div
                  key={item.id}
                  id={`sold-product-row-${item.id}`}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50/90 border border-slate-200 rounded-lg sm:rounded-xl transition-all shadow-2xs hover:border-blue-300 flex items-center justify-between gap-2 sm:gap-4"
                >
                  {/* 1. Nome do Produto */}
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 block truncate uppercase">
                      {item.name}
                    </span>
                  </div>

                  {/* 2. Quantidade Vendida | 3. Custo da Mercadoria | 4. Faturamento */}
                  <div className="flex items-center justify-end gap-2.5 sm:gap-6 shrink-0">
                    {/* Quantidade Vendida */}
                    <div className="text-right min-w-[55px] sm:min-w-[70px]">
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                        Qtd
                      </span>
                      <span className="text-xs sm:text-sm font-black text-blue-600 leading-tight block">
                        {item.quantity} <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">{item.unit}</span>
                      </span>
                    </div>

                    {/* Custo da Mercadoria */}
                    <div className="text-right min-w-[65px] sm:min-w-[90px] border-l border-slate-100 pl-1.5 sm:pl-0 sm:border-l-0">
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                        Custo
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 leading-tight block">
                        {formatCurrency(item.cost)}
                      </span>
                    </div>

                    {/* Faturamento */}
                    <div className="text-right min-w-[75px] sm:min-w-[95px] border-l border-slate-100 pl-1.5 sm:pl-0 sm:border-l-0">
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                        Faturamento
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-700 leading-tight block">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <span className="text-[11px] sm:text-xs">
            Exibindo <strong>{filteredAndSortedItems.length}</strong> de{' '}
            <strong>{aggregatedProducts.items.length}</strong> produtos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
