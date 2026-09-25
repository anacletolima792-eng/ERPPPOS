import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  Package,
  Sparkles,
  Coins,
  Scale,
  CalendarDays,
  X,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Product, Sale } from '../types';
import {
  formatCurrency,
  formatDateShort,
  formatDateOnly,
  formatMonthYear,
} from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import {
  DateFilterModal,
  DateFilterConfig,
  DateFilterType,
} from '../components/DateFilterModal';
import { DateFilterBar } from '../components/DateFilterBar';
import { CategorySalesModal } from '../components/CategorySalesModal';
import { AllSoldProductsModal } from '../components/AllSoldProductsModal';

interface DashboardPageProps {
  sales: Sale[];
  products: Product[];
  onNavigateToInventory?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  sales,
  products,
  onNavigateToInventory,
}) => {
  const { isAdmin } = useAuth();

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({
    type: 'today',
    customDate: getTodayStr(),
    customMonth: getMonthStr(),
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCategorySalesOpen, setIsCategorySalesOpen] = useState(false);
  const [isAllSoldProductsOpen, setIsAllSoldProductsOpen] = useState(false);

  // Filter sales by selected period (excluding canceled sales)
  const filteredSales = useMemo(() => {
    const activeSales = sales.filter((s) => s.status !== 'canceled');
    const now = new Date();

    return activeSales.filter((s) => {
      const saleDate = new Date(s.createdAt);

      if (dateFilter.type === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (dateFilter.type === '7days') {
        const diff = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 7 && saleDate <= now;
      }
      if (dateFilter.type === 'month') {
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter.type === 'custom_day' && dateFilter.customDate) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        const d = String(saleDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === dateFilter.customDate;
      }
      if (dateFilter.type === 'custom_month' && dateFilter.customMonth) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}` === dateFilter.customMonth;
      }
      if (dateFilter.type === 'custom_range') {
        const t = saleDate.getTime();
        const startT = dateFilter.customRangeStart
          ? new Date(`${dateFilter.customRangeStart}T00:00:00`).getTime()
          : 0;
        const endT = dateFilter.customRangeEnd
          ? new Date(`${dateFilter.customRangeEnd}T23:59:59.999`).getTime()
          : Infinity;
        return t >= startT && t <= endT;
      }
      return true; // 'all'
    });
  }, [sales, dateFilter]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  const totalCost = useMemo(() => {
    const productCostMap = new Map<string, number>();
    products.forEach((p) => {
      productCostMap.set(p.id, p.costPrice || 0);
    });

    return filteredSales.reduce((sum, s) => {
      if (typeof s.totalCost === 'number' && s.totalCost > 0) {
        return sum + s.totalCost;
      }
      const calculatedCost = (s.items || []).reduce((itemSum, item) => {
        const itemCost = item.costPrice || productCostMap.get(item.productId) || 0;
        return itemSum + itemCost * item.quantity;
      }, 0);
      return sum + calculatedCost;
    }, 0);
  }, [filteredSales, products]);

  const grossProfit = totalRevenue - totalCost;
  const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const salesCount = filteredSales.length;

  const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

  // Low stock products alert count
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  // Chart 1: Revenue & Sales by Day
  const chartDailyData = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number }>();

    // Sort ascending for chart
    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((sale) => {
      const key = formatDateShort(sale.createdAt);
      const current = map.get(key) || { label: key, total: 0, count: 0 };
      map.set(key, {
        label: key,
        total: current.total + sale.total,
        count: current.count + 1,
      });
    });

    return Array.from(map.values());
  }, [filteredSales]);

  // Payment Methods written breakdown (no chart)
  const paymentMethodsSummary = useMemo(() => {
    const methodsConfig = [
      { id: 'dinheiro', name: 'Dinheiro', color: '#f97316' },
      { id: 'pix', name: 'PIX', color: '#0ea5e9' },
      { id: 'credito', name: 'Cartão de Crédito', color: '#10b981' },
      { id: 'debito', name: 'Cartão de Débito', color: '#8b5cf6' },
      { id: 'prazo', name: 'A Prazo', color: '#eab308' },
    ];

    const statsMap = new Map<string, { total: number; count: number }>();
    let totalAll = 0;

    filteredSales.forEach((sale) => {
      const method = (sale.paymentMethod || 'outros').toLowerCase();
      const current = statsMap.get(method) || { total: 0, count: 0 };
      statsMap.set(method, {
        total: current.total + sale.total,
        count: current.count + 1,
      });
      totalAll += sale.total;
    });

    const standard = methodsConfig.map((m) => {
      const stat = statsMap.get(m.id) || { total: 0, count: 0 };
      const percentage = totalAll > 0 ? (stat.total / totalAll) * 100 : 0;
      return {
        ...m,
        total: stat.total,
        count: stat.count,
        percentage,
      };
    });

    const extras: Array<{ id: string; name: string; color: string; total: number; count: number; percentage: number }> = [];
    statsMap.forEach((stat, key) => {
      if (!methodsConfig.some((m) => m.id === key)) {
        extras.push({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          color: '#64748b',
          total: stat.total,
          count: stat.count,
          percentage: totalAll > 0 ? (stat.total / totalAll) * 100 : 0,
        });
      }
    });

    return [...standard, ...extras];
  }, [filteredSales]);

  // Chart 3: Top Selling Products (Name, Quantity, Revenue, Cost, Profit)
  const topProductsData = useMemo(() => {
    const productCostMap = new Map<string, number>();
    products.forEach((p) => {
      productCostMap.set(p.id, p.costPrice || 0);
    });

    const map = new Map<
      string,
      { name: string; quantity: number; revenue: number; cost: number; profit: number }
    >();

    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productId || item.productName;
        const current = map.get(key) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
        const unitCost =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : productCostMap.get(item.productId) || 0;
        const lineCost = unitCost * item.quantity;
        const lineRev = item.total;

        map.set(key, {
          name: item.productName,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + lineRev,
          cost: current.cost + lineCost,
          profit: current.profit + (lineRev - lineCost),
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales, products]);

  // Category Sales Preview for Dashboard
  const categorySalesPreview = useMemo(() => {
    const productInfoMap = new Map<
      string,
      { categoryName: string; costPrice: number }
    >();
    products.forEach((p) => {
      productInfoMap.set(p.id, {
        categoryName: p.categoryName || 'Sem Categoria',
        costPrice: p.costPrice || 0,
      });
    });

    const catMap = new Map<
      string,
      { name: string; revenue: number; cost: number; profit: number; quantity: number }
    >();

    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const prod = productInfoMap.get(item.productId);
        const catName = prod?.categoryName || 'Sem Categoria';
        const unitCost =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : prod?.costPrice || 0;
        const rev = item.total;
        const cst = unitCost * item.quantity;

        const current = catMap.get(catName) || {
          name: catName,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
        };

        catMap.set(catName, {
          name: catName,
          revenue: current.revenue + rev,
          cost: current.cost + cst,
          profit: current.profit + (rev - cst),
          quantity: current.quantity + item.quantity,
        });
      });
    });

    return Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // Helper to get active period label
  const getPeriodLabel = () => {
    if (dateFilter.type === 'today') return 'Hoje';
    if (dateFilter.type === '7days') return '7 Dias';
    if (dateFilter.type === 'month') return 'Mês Atual';
    if (dateFilter.type === 'custom_day' && dateFilter.customDate) {
      return formatDateOnly(dateFilter.customDate);
    }
    if (dateFilter.type === 'custom_month' && dateFilter.customMonth) {
      return formatMonthYear(dateFilter.customMonth);
    }
    if (
      dateFilter.type === 'custom_range' &&
      dateFilter.customRangeStart &&
      dateFilter.customRangeEnd
    ) {
      return `${formatDateOnly(dateFilter.customRangeStart)} - ${formatDateOnly(
        dateFilter.customRangeEnd
      )}`;
    }
    return 'Tudo';
  };

  const isCustomActive =
    dateFilter.type.startsWith('custom') || dateFilter.type === 'all';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Dashboard Executivo</h1>
            <p className="text-xs text-slate-500 font-medium">Relatórios, métricas de vendas e estoque em tempo real</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Standardized Period selector tabs with image-identical Calendar Popover */}
            <DateFilterBar
              currentFilter={dateFilter}
              onFilterChange={(newFilter) => setDateFilter(newFilter)}
              alignPopover="right"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
        {/* Active Filter Notification Bar */}
        {dateFilter.type !== 'today' && (
          <div className="bg-blue-50/90 border border-blue-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Filtro ativo:{' '}
                <strong className="font-black text-blue-950">
                  {dateFilter.type === '7days' && 'Últimos 7 Dias'}
                  {dateFilter.type === 'month' &&
                    `Mês Atual (${formatMonthYear(getMonthStr())})`}
                  {dateFilter.type === 'custom_day' &&
                    `Dia Específico: ${formatDateOnly(dateFilter.customDate)}`}
                  {dateFilter.type === 'custom_month' &&
                    `Mês Específico: ${formatMonthYear(dateFilter.customMonth)}`}
                  {dateFilter.type === 'custom_range' &&
                    `Intervalo: ${formatDateOnly(
                      dateFilter.customRangeStart
                    )} até ${formatDateOnly(dateFilter.customRangeEnd)}`}
                  {dateFilter.type === 'all' &&
                    'Todo o Histórico (Sem filtro de data)'}
                </strong>{' '}
                — ({salesCount}{' '}
                {salesCount === 1 ? 'venda localizada' : 'vendas localizadas'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Escolher Outra Data</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setDateFilter({
                    type: 'today',
                    customDate: getTodayStr(),
                    customMonth: getMonthStr(),
                  })
                }
                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Voltar p/ Hoje</span>
              </button>
            </div>
          </div>
        )}
        {/* KPI Cards Grid with High Density Dark Contrast Hero - 2 per line on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {/* Card 1: Faturamento Total - matching user visual attachment */}
          <div className="col-span-2 lg:col-span-1 bg-[#15225b] text-white p-5 sm:p-6 rounded-[22px] border border-[#23357d]/50 shadow-xl flex flex-col justify-between min-h-[145px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#9db0d8]">
                FATURAMENTO TOTAL
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#1d5bf6] flex items-center justify-center shrink-0 shadow-xs">
                <DollarSign className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
            </div>

            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight block leading-none">
                {formatCurrency(totalRevenue)}
              </span>
              <div className="text-xs sm:text-[13px] text-[#05df72] font-semibold flex items-center gap-1.5 mt-2.5">
                <TrendingUp className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span>
                  {salesCount} {salesCount === 1 ? 'venda registrada no período' : 'vendas registradas no período'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Custo das Vendas (CMV) */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate mr-1">Custo das Vendas</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight block truncate">
                {isAdmin ? formatCurrency(totalCost) : 'Restrito (Admin)'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium block mt-0.5 sm:mt-1 truncate">
                {isAdmin && totalRevenue > 0
                  ? `${costPercentage.toFixed(1)}% do faturamento`
                  : 'Custo de mercadorias (CMV)'}
              </span>
            </div>
          </div>

          {/* Card 3: Lucro Estimado (Admin) */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate mr-1">Lucro Bruto</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-emerald-700 tracking-tight block truncate">
                {isAdmin ? formatCurrency(grossProfit) : 'Restrito (Admin)'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium block mt-0.5 sm:mt-1 truncate">
                {isAdmin && totalRevenue > 0
                  ? `Margem: ${profitMargin.toFixed(1)}%`
                  : 'Faturamento líquido - Custo'}
              </span>
            </div>
          </div>

          {/* Card 4: Ticket Médio */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate mr-1">Ticket Médio</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-blue-600 tracking-tight block truncate">
                {formatCurrency(averageTicket)}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium block mt-0.5 sm:mt-1 truncate">
                Média por transação concluída
              </span>
            </div>
          </div>

          {/* Card 5: Alerta Estoque Baixo */}
          <div
            onClick={onNavigateToInventory}
            className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
              lowStockProducts.length > 0
                ? 'bg-orange-50/60 border-orange-200 hover:border-orange-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-950 truncate mr-1">
                Estoque Crítico
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-orange-950 tracking-tight block truncate">
                {lowStockProducts.length} {lowStockProducts.length === 1 ? 'item' : 'itens'}
              </span>
              <span className="text-[10px] sm:text-xs text-orange-800 font-bold flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                <span>Repor estoque</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart 1: Revenue Timeline */}
          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Faturamento no Período</h3>
                <p className="text-xs text-slate-500">Evolução de receitas ao longo do tempo</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="h-64 w-full">
              {chartDailyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  Sem vendas registradas neste período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value ?? 0);
                          return (
                            <div className="bg-[#0f172a] border border-slate-700/80 text-white px-3 py-2 rounded-xl shadow-xl text-xs">
                              <div className="font-bold text-white text-[11px] mb-1">
                                {label}
                              </div>
                              <div className="text-[#05df72] font-semibold flex items-center gap-1.5">
                                <span>Faturamento :</span>
                                <span className="font-bold">{formatCurrency(val)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Payment Methods - Written Information (No Chart) */}
          <div
            id="card-payment-methods-summary"
            className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Formas de Pagamento</h3>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3.5">Distribuição financeira por método</p>

              {/* Written methods list */}
              <div className="space-y-2">
                {paymentMethodsSummary.map((item) => (
                  <div
                    key={item.id}
                    id={`payment-method-row-${item.id}`}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      item.total > 0
                        ? 'bg-slate-50/90 border-slate-200'
                        : 'bg-white border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {item.count} {item.count === 1 ? 'venda' : 'vendas'}
                          {item.percentage > 0 ? ` • ${item.percentage.toFixed(0)}%` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`text-xs font-black block ${
                          item.total > 0 ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="pt-3 mt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Total Recebido</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Top Products, Category Sales & Critical Stock List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Widget 1: Top Selling Products */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">Produtos Mais Vendidos</h3>
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                <button
                  type="button"
                  id="btn-view-all-sold-products"
                  onClick={() => setIsAllSoldProductsOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer shrink-0 transition-colors"
                  title="Ver todos os produtos vendidos"
                >
                  Ver Todos
                </button>
              </div>
              <p className="text-xs text-slate-500">Volume, custo, lucro e faturamento</p>
            </div>

            <div className="space-y-2.5 pt-1 flex-1">
              {topProductsData.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum produto vendido no período</p>
              ) : (
                topProductsData.slice(0, 4).map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 transition-colors space-y-2.5"
                  >
                    {/* Linha 1: Nome do produto e no final a quantidade */}
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm truncate min-w-0 flex-1"
                        title={prod.name}
                      >
                        {prod.name}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider leading-none mb-0.5">
                          QTD
                        </span>
                        <span className="font-black text-blue-600 text-xs sm:text-sm leading-none">
                          {prod.quantity} UN
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: Custo, Lucro e Valor */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
                      {/* Custo */}
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider leading-none mb-1">
                          CUSTO
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate block leading-tight">
                          {isAdmin ? formatCurrency(prod.cost) : '***'}
                        </span>
                      </div>

                      {/* Lucro */}
                      <div className="min-w-0 border-l border-slate-200 dark:border-slate-700/60 pl-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider leading-none mb-1">
                          LUCRO
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs truncate block leading-tight">
                          {isAdmin ? formatCurrency(prod.profit) : '***'}
                        </span>
                      </div>

                      {/* Valor */}
                      <div className="min-w-0 border-l border-slate-200 dark:border-slate-700/60 pl-2 text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider leading-none mb-1">
                          VALOR
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs truncate block leading-tight">
                          {formatCurrency(prod.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 2: Vendas por Categoria (Venda, Custo, Lucro) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Vendas por Categoria</span>
                </h3>
                <p className="text-xs text-slate-500">Venda, custo e lucro por categoria</p>
              </div>
              <button
                type="button"
                id="btn-widget-category-sales"
                onClick={() => setIsCategorySalesOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                Ver Todas
              </button>
            </div>

            <div className="space-y-2 pt-1 flex-1">
              {categorySalesPreview.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhuma venda por categoria no período</p>
              ) : (
                categorySalesPreview.slice(0, 4).map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsCategorySalesOpen(true)}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900 truncate max-w-[140px]">
                        {cat.name}
                      </span>
                      <span className="font-black text-blue-600">
                        {formatCurrency(cat.revenue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        Custo: <strong className="text-slate-700">{isAdmin ? formatCurrency(cat.cost) : '***'}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Lucro: {isAdmin ? formatCurrency(cat.profit) : '***'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 3: Low Stock Alerts */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Alertas de Reposição</h3>
                <p className="text-xs text-slate-500">Itens com estoque crítico</p>
              </div>
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Estoque
              </button>
            </div>

            <div className="space-y-2 pt-1 flex-1">
              {lowStockProducts.length === 0 ? (
                <div className="p-6 text-center text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold">
                  ✓ Todos os produtos estão com estoque regular!
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 truncate block uppercase">{prod.name}</span>
                      <span className="text-[10px] text-slate-500">Cód: {prod.code} • Mín: {prod.minStock} {prod.unit}</span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className={`font-black text-sm block ${prod.stock <= 0 ? 'text-red-600' : 'text-orange-700'}`}>
                        {prod.stock} {prod.unit}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-red-600">
                        {prod.stock <= 0 ? 'Esgotado' : 'Crítico'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Date & Period Selection Modal */}
      <DateFilterModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onApply={(newFilter) => setDateFilter(newFilter)}
        currentFilter={dateFilter}
        sales={sales}
      />

      {/* Category Sales Breakdown Modal */}
      <CategorySalesModal
        isOpen={isCategorySalesOpen}
        onClose={() => setIsCategorySalesOpen(false)}
        sales={filteredSales}
        allSales={sales}
        products={products}
        periodLabel={getPeriodLabel()}
        isAdmin={isAdmin}
        currentFilter={dateFilter}
        onFilterChange={(newFilter) => setDateFilter(newFilter)}
      />

      {/* All Sold Products Modal */}
      <AllSoldProductsModal
        isOpen={isAllSoldProductsOpen}
        onClose={() => setIsAllSoldProductsOpen(false)}
        sales={filteredSales}
        allSales={sales}
        products={products}
        periodLabel={getPeriodLabel()}
        isAdmin={isAdmin}
        currentFilter={dateFilter}
        onFilterChange={(newFilter) => setDateFilter(newFilter)}
      />
    </div>
  );
};
