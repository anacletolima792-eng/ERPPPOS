import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  DollarSign,
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
import { SaleDetailModal } from '../components/SaleDetailModal';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  DateFilterModal,
  DateFilterConfig,
} from '../components/DateFilterModal';
import { DateFilterBar } from '../components/DateFilterBar';
import { OperatorSwitchModal } from '../components/OperatorSwitchModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

interface SalesHistoryPageProps {
  sales: Sale[];
  loading: boolean;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ sales, loading }) => {
  const { currentUser, isAdmin } = useAuth();
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
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);

  // Filter sales
  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter((s) => {
      const term = searchTerm.toLowerCase().trim();
      const saleNum = (s.saleNumber || '').toLowerCase();
      const custName = (s.customerName || '').toLowerCase();
      const opName = (s.operatorName || '').toLowerCase();

      const matchesSearch =
        !term ||
        saleNum.includes(term) ||
        custName.includes(term) ||
        opName.includes(term);

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

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
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
      {/* Header with Segmented Period Selector */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Histórico de Vendas</h1>
                <span
                  id="badge-effective-sales-count"
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                  title="Quantidade de vendas efetivadas conforme data escolhida"
                >
                  {effectiveSalesCount} {effectiveSalesCount === 1 ? 'efetivada' : 'efetivadas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consultas de cupons fiscais, estornos e faturamento</p>
            </div>
            {/* ThemeToggle visible on mobile next to title */}
            <div className="sm:hidden shrink-0">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* ThemeToggle on larger screens */}
            <div className="hidden sm:block shrink-0">
              <ThemeToggle />
            </div>

            {/* Operator Switcher */}
            <button
              type="button"
              id="btn-sales-operator-switch"
              onClick={() => setIsOperatorModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Trocar operador do sistema"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                {currentUser.name}
              </span>
              <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-extrabold border ${
                isAdmin
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}>
                {isAdmin ? 'Admin' : 'Vendedor'}
              </span>
            </button>

            {/* Standardized Period selector tabs matching Dashboard */}
            <DateFilterBar
              currentFilter={dateFilter}
              onFilterChange={(newFilter) => setDateFilter(newFilter)}
              alignPopover="left"
            />

            {/* Small Dropdown Button: Status */}
            <div
              className="relative inline-flex"
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
                className={`h-9 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer ${
                  statusFilter !== 'all'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
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

            {/* Small Dropdown Button: Forma de Pagamento */}
            <div
              className="relative inline-flex"
              title={`Forma de Pagamento: ${
                paymentFilter === 'all'
                  ? 'Todas as Formas'
                  : paymentFilter.toUpperCase()
              }`}
            >
              <div
                className={`h-9 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer ${
                  paymentFilter !== 'all'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
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

            <button
              type="button"
              id="btn-export-sales-csv"
              onClick={handleExportCSV}
              className="h-9 px-2.5 sm:px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer shrink-0"
              title="Exportar Vendas para planilha Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline">Exportar Vendas</span>
            </button>

            {/* Search Input right in front of the export button */}
            <div className="relative min-w-[150px] sm:min-w-[210px] md:w-64">
              <input
                type="text"
                id="input-sales-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cupom #, cliente..."
                className="w-full h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all shadow-2xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
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

      {/* Operator Switch Modal */}
      <OperatorSwitchModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
      />
    </div>
  );
};
