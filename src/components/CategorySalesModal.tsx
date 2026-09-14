import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  TrendingUp,
  DollarSign,
  Coins,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
} from 'lucide-react';
import { Product, Sale } from '../types';
import { formatCurrency } from '../utils/formatters';
import { DateFilterBar } from './DateFilterBar';
import { DateFilterConfig } from './DateFilterModal';
import { filterSalesByDate, getDateFilterLabel } from '../utils/dateFilter';

interface CategorySalesModalProps {
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

interface ProductSaleDetail {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface CategorySaleSummary {
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  margin: number;
  revenueShare: number;
  productCount: number;
  products: ProductSaleDetail[];
}

export const CategorySalesModal: React.FC<CategorySalesModalProps> = ({
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
  const [sortBy, setSortBy] = useState<
    'revenue_desc' | 'profit_desc' | 'cost_desc' | 'qty_desc' | 'name_asc'
  >('revenue_desc');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

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

  // Map product id to cost and category
  const productInfoMap = useMemo(() => {
    const map = new Map<
      string,
      { categoryName: string; costPrice: number; price: number }
    >();
    products.forEach((p) => {
      map.set(p.id, {
        categoryName: p.categoryName || 'Sem Categoria',
        costPrice: p.costPrice || 0,
        price: p.price || 0,
      });
    });
    return map;
  }, [products]);

  // Group items by category
  const categorySummaries = useMemo(() => {
    const catMap = new Map<
      string,
      {
        totalQuantity: number;
        totalRevenue: number;
        totalCost: number;
        productMap: Map<string, ProductSaleDetail>;
      }
    >();

    let grandTotalRevenue = 0;

    activeSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const prodInfo = productInfoMap.get(item.productId);
        const catName =
          prodInfo?.categoryName || item.productName
            ? prodInfo?.categoryName || 'Geral'
            : 'Sem Categoria';

        const unitCost =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : prodInfo?.costPrice || 0;

        const itemRevenue = item.total;
        const itemCost = unitCost * item.quantity;

        grandTotalRevenue += itemRevenue;

        if (!catMap.has(catName)) {
          catMap.set(catName, {
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            productMap: new Map(),
          });
        }

        const catData = catMap.get(catName)!;
        catData.totalQuantity += item.quantity;
        catData.totalRevenue += itemRevenue;
        catData.totalCost += itemCost;

        // Product sub-detail
        const prodKey = item.productId || item.productName;
        if (!catData.productMap.has(prodKey)) {
          catData.productMap.set(prodKey, {
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode || '',
            quantity: 0,
            unit: item.unit || 'UN',
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          });
        }

        const prodData = catData.productMap.get(prodKey)!;
        prodData.quantity += item.quantity;
        prodData.revenue += itemRevenue;
        prodData.cost += itemCost;
      });
    });

    const list: CategorySaleSummary[] = [];

    catMap.forEach((data, categoryName) => {
      const totalProfit = data.totalRevenue - data.totalCost;
      const margin =
        data.totalRevenue > 0 ? (totalProfit / data.totalRevenue) * 100 : 0;
      const revenueShare =
        grandTotalRevenue > 0
          ? (data.totalRevenue / grandTotalRevenue) * 100
          : 0;

      const productList: ProductSaleDetail[] = Array.from(
        data.productMap.values()
      ).map((p) => {
        const profit = p.revenue - p.cost;
        const pMargin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
        return {
          ...p,
          profit,
          margin: pMargin,
        };
      });

      // Sort products inside category by revenue
      productList.sort((a, b) => b.revenue - a.revenue);

      list.push({
        categoryName,
        totalQuantity: data.totalQuantity,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit,
        margin,
        revenueShare,
        productCount: productList.length,
        products: productList,
      });
    });

    return list;
  }, [sales, productInfoMap]);

  // Filter and sort category list
  const filteredCategories = useMemo(() => {
    let result = categorySummaries.filter((cat) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchCat = cat.categoryName.toLowerCase().includes(term);
      const matchProd = cat.products.some((p) =>
        p.productName.toLowerCase().includes(term)
      );
      return matchCat || matchProd;
    });

    result.sort((a, b) => {
      if (sortBy === 'revenue_desc') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'profit_desc') return b.totalProfit - a.totalProfit;
      if (sortBy === 'cost_desc') return b.totalCost - a.totalCost;
      if (sortBy === 'qty_desc') return b.totalQuantity - a.totalQuantity;
      if (sortBy === 'name_asc')
        return a.categoryName.localeCompare(b.categoryName);
      return 0;
    });

    return result;
  }, [categorySummaries, searchTerm, sortBy]);

  // Overall totals
  const grandTotals = useMemo(() => {
    const totalRev = filteredCategories.reduce((acc, c) => acc + c.totalRevenue, 0);
    const totalCst = filteredCategories.reduce((acc, c) => acc + c.totalCost, 0);
    const totalProf = totalRev - totalCst;
    const totalQty = filteredCategories.reduce((acc, c) => acc + c.totalQuantity, 0);
    const avgMargin = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;

    return { totalRev, totalCst, totalProf, totalQty, avgMargin };
  }, [filteredCategories]);

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    if (filteredCategories.length === 0) return;

    const headers = [
      'Categoria',
      'Quantidade Vendida',
      'Valor da Venda (R$)',
      'Valor de Custo (R$)',
      'Valor do Lucro (R$)',
      'Margem (%)',
      'Participacao (%)',
      'Qtd Produtos Distintos',
    ];

    const rows = filteredCategories.map((c) => [
      `"${c.categoryName}"`,
      c.totalQuantity,
      c.totalRevenue.toFixed(2),
      c.totalCost.toFixed(2),
      c.totalProfit.toFixed(2),
      c.margin.toFixed(2) + '%',
      c.revenueShare.toFixed(2) + '%',
      c.productCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `vendas_por_categoria_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Vendas por Categoria
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {effectivePeriodLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <DateFilterBar
              currentFilter={effectiveFilter}
              onFilterChange={handleFilterChange}
              alignPopover="right"
              compact={true}
            />
            <button
              type="button"
              onClick={onClose}
              id="btn-close-category-sales-modal"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Single-row Minimalist KPI Cards (Valor da Venda, Custo CMV, Lucro Bruto) */}
        <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200 shrink-0">
          {/* Card 1: Valor da Venda */}
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-tight block truncate">
                Valor da Venda
              </span>
              <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                {formatCurrency(grandTotals.totalRev)}
              </div>
            </div>
            <DollarSign className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          </div>

          {/* Card 2: Valor de Custo */}
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-tight block truncate">
                Custo (CMV)
              </span>
              <div className="text-xs sm:text-sm font-black text-slate-800 leading-tight truncate">
                {isAdmin ? formatCurrency(grandTotals.totalCst) : 'Restrito'}
              </div>
            </div>
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          </div>

          {/* Card 3: Valor do Lucro */}
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-tight block truncate">
                Lucro Bruto
              </span>
              <div className="text-xs sm:text-sm font-black text-emerald-700 leading-tight truncate">
                {isAdmin ? formatCurrency(grandTotals.totalProf) : 'Restrito'}
              </div>
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
        </div>

        {/* Toolbar (Search, Sort, Export) */}
        <div className="p-3 sm:px-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar categoria ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 font-bold text-xs outline-hidden cursor-pointer"
              >
                <option value="revenue_desc">Maior Valor de Venda</option>
                <option value="profit_desc">Maior Valor de Lucro</option>
                <option value="cost_desc">Maior Valor de Custo</option>
                <option value="qty_desc">Mais Itens Vendidos</option>
                <option value="name_asc">Nome da Categoria (A-Z)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              id="btn-export-category-sales"
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Content Table / Cards */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-5">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                Nenhuma venda por categoria encontrada
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Não foram localizadas vendas para o período selecionado ({periodLabel}).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((cat, idx) => {
                const isExpanded = expandedCategories.has(cat.categoryName);

                return (
                  <div
                    key={cat.categoryName}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                  >
                    {/* Category Main Row */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.categoryName)}
                      className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Left: Category Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 truncate">
                              {cat.categoryName}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {cat.productCount}{' '}
                              {cat.productCount === 1 ? 'produto' : 'produtos'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              {cat.revenueShare.toFixed(1)}% do total
                            </span>
                          </div>
                          <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(5, cat.revenueShare))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics (Valor da Venda, Valor de Custo, Valor do Lucro) */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 items-center text-right pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {/* Qtd */}
                        <div className="hidden sm:block">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Qtd Vendida
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {cat.totalQuantity} un
                          </span>
                        </div>

                        {/* Valor da Venda */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Valor da Venda
                          </span>
                          <span className="text-xs sm:text-sm font-black text-blue-600">
                            {formatCurrency(cat.totalRevenue)}
                          </span>
                        </div>

                        {/* Valor de Custo */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Valor de Custo
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-700">
                            {isAdmin ? formatCurrency(cat.totalCost) : 'Restrito'}
                          </span>
                        </div>

                        {/* Valor do Lucro */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Valor do Lucro
                          </span>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs sm:text-sm font-black text-emerald-700">
                              {isAdmin ? formatCurrency(cat.totalProfit) : 'Restrito'}
                            </span>
                          </div>
                          {isAdmin && (
                            <span className="text-[9px] font-bold text-emerald-600 block">
                              Margem: {cat.margin.toFixed(1)}%
                            </span>
                          )}
                        </div>

                        <div className="hidden lg:flex items-center justify-end pl-2">
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-item table for products when expanded */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-200 px-3 py-3 sm:px-4 sm:py-3 animate-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            Produtos vendidos em "{cat.categoryName}"
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {cat.products.length} itens listados
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                              <tr>
                                <th className="px-3 py-2">Produto</th>
                                <th className="px-3 py-2 text-center">Qtd</th>
                                <th className="px-3 py-2 text-right">Valor Venda</th>
                                <th className="px-3 py-2 text-right">Valor Custo</th>
                                <th className="px-3 py-2 text-right">Valor Lucro</th>
                                <th className="px-3 py-2 text-right">Margem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {cat.products.map((prod) => (
                                <tr key={prod.productId || prod.productName} className="hover:bg-slate-50/80">
                                  <td className="px-3 py-2 font-semibold text-slate-900">
                                    <span className="block truncate max-w-xs sm:max-w-md">
                                      {prod.productName}
                                    </span>
                                    {prod.productCode && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Cód: {prod.productCode}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-bold">
                                    {prod.quantity} {prod.unit}
                                  </td>
                                  <td className="px-3 py-2 text-right font-black text-blue-600">
                                    {formatCurrency(prod.revenue)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium text-slate-600">
                                    {isAdmin ? formatCurrency(prod.cost) : 'Restrito'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-black text-emerald-700">
                                    {isAdmin ? formatCurrency(prod.profit) : 'Restrito'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-slate-700">
                                    {isAdmin ? (
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          prod.margin >= 40
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : prod.margin >= 20
                                            ? 'bg-blue-100 text-blue-800'
                                            : prod.margin > 0
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {prod.margin.toFixed(1)}%
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Exibindo dados consolidados com base no período ativo.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
