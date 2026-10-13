import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Printer,
  ChevronRight,
  Download,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CalendarDays,
  X,
  CreditCard,
  ChevronDown,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { Sale } from '../types';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateOnly,
  formatMonthYear,
  formatTime,
} from '../utils/formatters';
import { filterSalesSemantically, parseSearchQuery } from '../utils/semanticSearch';
import { SaleDetailModal } from '../components/SaleDetailModal';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  DateFilterModal,
  DateFilterConfig,
} from '../components/DateFilterModal';
import { DateFilterBar } from '../components/DateFilterBar';
import { QuoteModal } from '../components/QuoteModal';

interface SalesHistoryPageProps {
  sales: Sale[];
  loading: boolean;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ sales, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'returned' | 'canceled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Semantic and intent parsing for search
  const parsedSearch = useMemo(() => {
    return parseSearchQuery(searchTerm);
  }, [searchTerm]);

  // Filter sales with semantic matching, partial words, intents, status, payment and date
  const filteredSales = useMemo(() => {
    const now = new Date();
    const { filtered } = filterSalesSemantically(sales, searchTerm);

    return filtered.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

      // Date filtering
      let matchesDate = true;
      const saleDate = new Date(s.createdAt);

      if (dateFilter.type === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter.type === '7days') {
        const diff = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        matchesDate = diff <= 7 && saleDate <= now;
      } else if (dateFilter.type === 'month') {
        matchesDate =
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
      } else if (dateFilter.type === 'custom_day' && dateFilter.customDate) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        const d = String(saleDate.getDate()).padStart(2, '0');
        matchesDate = `${y}-${m}-${d}` === dateFilter.customDate;
      } else if (dateFilter.type === 'custom_month' && dateFilter.customMonth) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        matchesDate = `${y}-${m}` === dateFilter.customMonth;
      } else if (dateFilter.type === 'custom_range') {
        const t = saleDate.getTime();
        const startT = dateFilter.customRangeStart
          ? new Date(`${dateFilter.customRangeStart}T00:00:00`).getTime()
          : 0;
        const endT = dateFilter.customRangeEnd
          ? new Date(`${dateFilter.customRangeEnd}T23:59:59.999`).getTime()
          : Infinity;
        matchesDate = t >= startT && t <= endT;
      }

      return matchesStatus && matchesPayment && matchesDate;
    });
  }, [sales, searchTerm, statusFilter, paymentFilter, dateFilter]);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleOpenReceipt = (sale: Sale) => {
    setReceiptSale(sale);
    setIsReceiptOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Nº Venda', 'Data/Hora', 'Operador', 'Cliente', 'Subtotal', 'Desconto', 'Total (R$)', 'Forma Pagamento', 'Status'];
    const rows = filteredSales.map((s) => [
      `"${s.saleNumber}"`,
      `"${formatDate(s.createdAt)}"`,
      `"${s.operatorName}"`,
      `"${s.customerName || 'Balcão'}"`,
      s.subtotal.toFixed(2),
      s.discount.toFixed(2),
      s.total.toFixed(2),
      `"${s.paymentMethod.toUpperCase()}"`,
      `"${s.status === 'completed' ? 'Concluída' : s.status === 'returned' ? 'Devolução' : 'Cancelada'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_vendas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Quantity of effective (non-canceled) sales according to chosen date
  const effectiveSalesCount = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status === 'canceled') return false;

      let matchesDate = true;
      const saleDate = new Date(s.createdAt);

      if (dateFilter.type === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter.type === 'month') {
        matchesDate =
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
      } else if (dateFilter.type === 'custom_day' && dateFilter.customDate) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        const d = String(saleDate.getDate()).padStart(2, '0');
        matchesDate = `${y}-${m}-${d}` === dateFilter.customDate;
      } else if (dateFilter.type === 'custom_month' && dateFilter.customMonth) {
        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        matchesDate = `${y}-${m}` === dateFilter.customMonth;
      } else if (dateFilter.type === 'custom_range') {
        const t = saleDate.getTime();
        const startT = dateFilter.customRangeStart
          ? new Date(`${dateFilter.customRangeStart}T00:00:00`).getTime()
          : 0;
        const endT = dateFilter.customRangeEnd
          ? new Date(`${dateFilter.customRangeEnd}T23:59:59.999`).getTime()
          : Infinity;
        matchesDate = t >= startT && t <= endT;
      }

      return matchesDate;
    }).length;
  }, [sales, dateFilter]);

  const isCustomActive =
    dateFilter.type.startsWith('custom') || dateFilter.type === 'all';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col pb-24 transition-colors">
      {/* Header matching exact layout from attached image */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 shadow-xs transition-colors">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-3.5">
          {/* Row 1: Title, Effective Sales Badge and Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Histórico de Vendas
              </h1>
              <span
                id="badge-effective-sales-count"
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                title="Quantidade de vendas efetivadas conforme data escolhida"
              >
                {effectiveSalesCount} {effectiveSalesCount === 1 ? 'efetivada' : 'efetivadas'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Optional Export Button cleanly positioned in top corner */}
              <button
                type="button"
                id="btn-export-sales-csv"
                onClick={handleExportCSV}
                className="h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Exportar Vendas para planilha Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>

          {/* Row 2: [ Hoje Mês 📅 Tudo ⌵ ] on left, [ 🌪 Status ⌵ ] on right */}
          <div className="flex items-center justify-between gap-3">
            {/* Date filter pill */}
            <DateFilterBar
              currentFilter={dateFilter}
              onFilterChange={(newFilter) => setDateFilter(newFilter)}
              alignPopover="left"
              pill={true}
              className="shrink-0"
            />

            {/* Status pill dropdown button */}
            <div
              className="relative inline-flex shrink-0"
              title={`Status: ${
                statusFilter === 'all'
                  ? 'Todos os Status'
                  : statusFilter === 'completed'
                  ? 'Concluídas'
                  : statusFilter === 'returned'
                  ? 'Devoluções'
                  : 'Canceladas'
              }`}
            >
              <div
                className={`h-9 px-3.5 sm:px-4 rounded-full border ${
                  statusFilter !== 'all'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                } text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer`}
              >
                <Filter className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                <span>
                  {statusFilter === 'all'
                    ? 'Status'
                    : statusFilter === 'completed'
                    ? 'Concluídas'
                    : statusFilter === 'returned'
                    ? 'Devoluções'
                    : 'Canceladas'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                {statusFilter !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <select
                id="select-sales-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                title="Filtrar por Status"
              >
                <option value="all">Todos os Status</option>
                <option value="completed">Concluídas</option>
                <option value="returned">Devoluções</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
          </div>

          {/* Row 3: [ 📄 Orçamentos ] on left, [ 💳 Pagamento ⌵ ] on right */}
          <div className="flex items-center justify-between gap-3">
            {/* Orçamentos pill button */}
            <button
              type="button"
              id="btn-sales-view-quotes"
              onClick={() => setIsQuoteModalOpen(true)}
              className="h-9 px-4 rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-800 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Consultar e gerenciar orçamentos salvos"
            >
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Orçamentos</span>
            </button>

            {/* Pagamento pill dropdown button */}
            <div
              className="relative inline-flex shrink-0"
              title={`Forma de Pagamento: ${
                paymentFilter === 'all'
                  ? 'Todas as Formas'
                  : paymentFilter.toUpperCase()
              }`}
            >
              <div
                className={`h-9 px-3.5 sm:px-4 rounded-full border ${
                  paymentFilter !== 'all'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-blue-300 dark:border-blue-700/80 bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                } text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer`}
              >
                <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{paymentFilter === 'all' ? 'Pagamento' : paymentFilter.toUpperCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                {paymentFilter !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <select
                id="select-sales-payment"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                title="Filtrar por Forma de Pagamento"
              >
                <option value="all">Todas as Formas</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="prazo">A Prazo</option>
              </select>
            </div>
          </div>

          {/* Row 4: Full-width search input [ 🔍 Buscar cupom #, cliente... ] */}
          <div className="relative w-full">
            <input
              type="text"
              id="input-sales-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cupom #, cliente..."
              title="Busca Semântica por Intenção ou Correspondência Parcial (ex: cliente, produto vendido, pix, canceladas, desconto, >100)"
              className="w-full h-10 sm:h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-10 pr-10 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                id="btn-clear-sales-search"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-3">
        {/* Semantic Search Detected Intents Bar */}
        {parsedSearch.detectedIntents.length > 0 && (
          <div
            id="bar-semantic-search-intents"
            className="flex flex-wrap items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 shadow-2xs"
          >
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Intenção detectada:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {parsedSearch.detectedIntents.map((intent, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 shadow-2xs"
                >
                  {intent.label}
                </span>
              ))}
            </div>
            {parsedSearch.residualTokens.length > 0 && (
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                Termos parciais: &quot;{parsedSearch.residualTokens.join(' ')}&quot;
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-auto font-medium">
              {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'}
            </span>
          </div>
        )}
        {/* Sales List as a scrollable container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors">
          {/* Scrollable list area */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[calc(100vh-170px)] sm:max-h-[calc(100vh-140px)]">
            {filteredSales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <Receipt className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Nenhuma venda encontrada</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {searchTerm ? 'Tente ajustar os termos de busca.' : 'Realize vendas no PDV para listar aqui.'}
                </p>
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isCanceled = sale.status === 'canceled';
                const isReturned = sale.status === 'returned';

                return (
                  <div
                    key={sale.id}
                    onClick={() => handleOpenDetail(sale)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 cursor-pointer group text-xs sm:text-sm"
                  >
                    {/* 1. Hora */}
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold tabular-nums shrink-0 min-w-[52px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{formatTime(sale.createdAt)}</span>
                    </div>

                    {/* 2. Nome do Vendedor */}
                    <div className="min-w-0 flex-1 px-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate flex items-center gap-1.5">
                        <span className="truncate">{sale.operatorName || 'Caixa'}</span>
                        {isReturned && (
                          <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
                            Devolução
                          </span>
                        )}
                        {isCanceled && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 shrink-0">
                            Cancelada
                          </span>
                        )}
                      </span>
                    </div>

                    {/* 3. Valor da Venda */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-black tabular-nums text-xs sm:text-sm ${
                          isCanceled
                            ? 'text-slate-400 dark:text-slate-500 line-through'
                            : isReturned
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isReturned ? `- ${formatCurrency(sale.total)}` : formatCurrency(sale.total)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <SaleDetailModal
        sale={selectedSale}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenReceipt={handleOpenReceipt}
      />

      <ReceiptModal
        sale={receiptSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <DateFilterModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onApply={(newFilter) => setDateFilter(newFilter)}
        currentFilter={dateFilter}
        sales={sales}
      />

      {/* Quote Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
