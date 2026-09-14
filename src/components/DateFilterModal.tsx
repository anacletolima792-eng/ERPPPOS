import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Search,
} from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDateOnly, formatMonthYear } from '../utils/formatters';

export type DateFilterType =
  | 'today'
  | '7days'
  | 'month'
  | 'all'
  | 'custom_day'
  | 'custom_month'
  | 'custom_range';

export interface DateFilterConfig {
  type: DateFilterType;
  customDate?: string; // YYYY-MM-DD
  customMonth?: string; // YYYY-MM
  customRangeStart?: string; // YYYY-MM-DD
  customRangeEnd?: string; // YYYY-MM-DD
}

interface DateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: DateFilterConfig) => void;
  currentFilter: DateFilterConfig;
  sales?: Sale[];
}

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const DateFilterModal: React.FC<DateFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilter,
  sales = [],
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getMonthStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  // Determine initial year and month
  const getInitialYearMonth = () => {
    if (currentFilter.customDate) {
      const [y, m] = currentFilter.customDate.split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    if (currentFilter.customRangeStart) {
      const [y, m] = currentFilter.customRangeStart.split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    if (currentFilter.customMonth) {
      const [y, m] = currentFilter.customMonth.split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  };

  const initialYM = getInitialYearMonth();
  const [viewYear, setViewYear] = useState<number>(initialYM.year);
  const [viewMonth, setViewMonth] = useState<number>(initialYM.month);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  // Selection mode: 'single' | 'range'
  const [mode, setMode] = useState<'single' | 'range'>(
    currentFilter.type === 'custom_range' ? 'range' : 'single'
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    currentFilter.customDate || (currentFilter.type === 'today' ? getTodayStr() : '')
  );
  const [rangeStart, setRangeStart] = useState<string>(currentFilter.customRangeStart || '');
  const [rangeEnd, setRangeEnd] = useState<string>(currentFilter.customRangeEnd || '');

  useEffect(() => {
    if (isOpen) {
      const ym = getInitialYearMonth();
      setViewYear(ym.year);
      setViewMonth(ym.month);
      setIsMonthSelectOpen(false);

      if (currentFilter.type === 'custom_range') {
        setMode('range');
        setRangeStart(currentFilter.customRangeStart || '');
        setRangeEnd(currentFilter.customRangeEnd || '');
        setSelectedDate('');
      } else if (currentFilter.type === 'custom_day') {
        setMode('single');
        setSelectedDate(currentFilter.customDate || getTodayStr());
        setRangeStart('');
        setRangeEnd('');
      } else if (currentFilter.type === 'today') {
        setMode('single');
        setSelectedDate(getTodayStr());
        setRangeStart('');
        setRangeEnd('');
      } else {
        setMode('single');
        setSelectedDate('');
        setRangeStart('');
        setRangeEnd('');
      }
    }
  }, [isOpen, currentFilter]);

  // Preview matching sales
  const previewData = useMemo(() => {
    const validSales = sales.filter((s) => s.status !== 'canceled');

    let matching = validSales;
    if (mode === 'single' && selectedDate) {
      matching = validSales.filter((s) => {
        const sDate = new Date(s.createdAt);
        const y = sDate.getFullYear();
        const m = String(sDate.getMonth() + 1).padStart(2, '0');
        const d = String(sDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === selectedDate;
      });
    } else if (mode === 'range' && (rangeStart || rangeEnd)) {
      const start = rangeStart || rangeEnd;
      const end = rangeEnd || rangeStart;
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;
      matching = validSales.filter((sale) => {
        const sDate = new Date(sale.createdAt);
        const y = sDate.getFullYear();
        const m = String(sDate.getMonth() + 1).padStart(2, '0');
        const d = String(sDate.getDate()).padStart(2, '0');
        const dayStr = `${y}-${m}-${d}`;
        return dayStr >= s && dayStr <= e;
      });
    }

    const count = matching.length;
    const total = matching.reduce((sum, s) => sum + s.total, 0);
    return { count, total };
  }, [sales, mode, selectedDate, rangeStart, rangeEnd]);

  if (!isOpen) return null;

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  interface CalendarDayCell {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
  }

  const cells: CalendarDayCell[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  const handleDayClick = (dateStr: string) => {
    if (mode === 'single') {
      setSelectedDate(dateStr);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dateStr);
        setRangeEnd('');
      } else {
        if (dateStr < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        } else {
          setRangeEnd(dateStr);
        }
      }
    }
  };

  const handleApply = () => {
    if (mode === 'single') {
      if (selectedDate) {
        onApply({
          type: 'custom_day',
          customDate: selectedDate,
        });
      } else {
        onApply({ type: 'all' });
      }
    } else {
      if (rangeStart) {
        const start = rangeStart;
        const end = rangeEnd || rangeStart;
        const sortedStart = start <= end ? start : end;
        const sortedEnd = start <= end ? end : start;
        onApply({
          type: 'custom_range',
          customRangeStart: sortedStart,
          customRangeEnd: sortedEnd,
        });
      } else {
        onApply({ type: 'all' });
      }
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedDate('');
    setRangeStart('');
    setRangeEnd('');
    onApply({ type: 'all' });
    onClose();
  };

  const handleToday = () => {
    const todayStr = getTodayStr();
    setSelectedDate(todayStr);
    onApply({
      type: 'today',
      customDate: todayStr,
      customMonth: getMonthStr(),
    });
    onClose();
  };

  const isSelectedSingle = (dateStr: string) => {
    return mode === 'single' && selectedDate === dateStr;
  };

  const isRangeEndpoint = (dateStr: string) => {
    if (mode !== 'range') return false;
    return dateStr === rangeStart || dateStr === rangeEnd;
  };

  const isWithinRange = (dateStr: string) => {
    if (mode !== 'range' || !rangeStart || !rangeEnd) return false;
    const s = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const e = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    return dateStr > s && dateStr < e;
  };

  const currentYearNow = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYearNow - 5; y <= currentYearNow + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div
      id="date-filter-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="date-filter-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[340px] sm:max-w-[360px] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">
                Buscar por Data
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Escolha dia ou período
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-date-modal"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-2.5 overflow-y-auto">
          {/* Mode Switch: Dia Único vs Intervalo */}
          <div className="flex items-center justify-between pb-1 text-xs font-bold">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center text-xs ${
                  mode === 'single'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dia Único
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center text-xs ${
                  mode === 'range'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Intervalo (Período)
              </button>
            </div>
          </div>

          {/* Interval Input Fields */}
          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Data Início
                </label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Data Final
                </label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Calendar Header: "setembro de 2026 ▾" and arrows ↑ ↓ */}
          <div className="flex items-center justify-between px-1 py-0.5 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
                className="flex items-center gap-1 text-sm font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer py-0.5 rounded"
              >
                <span>
                  {MONTH_NAMES_PT[viewMonth]} de {viewYear}
                </span>
                <span className="text-xs">▾</span>
              </button>

              {isMonthSelectOpen && (
                <div className="absolute top-full left-0 mt-1 z-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-48 text-xs">
                  <div className="mb-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Ano
                    </span>
                    <select
                      value={viewYear}
                      onChange={(e) => setViewYear(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-1 bg-slate-50 font-bold"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Mês
                    </span>
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                      {MONTH_NAMES_PT.map((mName, idx) => (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setViewMonth(idx);
                            setIsMonthSelectOpen(false);
                          }}
                          className={`text-left px-2 py-1 rounded text-[11px] font-bold capitalize transition-colors ${
                            viewMonth === idx
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {mName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowDown className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Weekday Row: D S T Q Q S S */}
          <div className="grid grid-cols-7 gap-1 text-center mb-0.5">
            {WEEK_DAYS.map((wd, i) => (
              <div
                key={`${wd}-${i}`}
                className="text-xs font-semibold text-slate-800 py-0.5"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid: 7 columns */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((cell, idx) => {
              const isSelected = isSelectedSingle(cell.dateStr);
              const isEndpoint = isRangeEndpoint(cell.dateStr);
              const inRange = isWithinRange(cell.dateStr);

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  onClick={() => handleDayClick(cell.dateStr)}
                  className={`h-8 w-full rounded text-xs transition-all flex items-center justify-center cursor-pointer relative ${
                    isSelected || isEndpoint
                      ? 'bg-blue-600 text-white font-black border-2 border-black rounded-md shadow-xs z-10 scale-105'
                      : inRange
                      ? 'bg-blue-100 text-blue-900 font-bold rounded-none'
                      : cell.isCurrentMonth
                      ? 'text-slate-900 font-semibold hover:bg-slate-100'
                      : 'text-slate-400 font-normal hover:bg-slate-50'
                  }`}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Quick Preview Badge */}
          {sales.length > 0 && (
            <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-[11px] text-blue-900">
              <span className="font-medium">
                {previewData.count} {previewData.count === 1 ? 'venda' : 'vendas'} encontradas
              </span>
              <span className="font-bold text-blue-950">
                {formatCurrency(previewData.total)}
              </span>
            </div>
          )}

          {/* Apply Button (for range or to confirm) */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar Filtro</span>
          </button>

          {/* Bottom links: Limpar & Hoje */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 px-1 text-sm font-medium">
            <button
              type="button"
              onClick={handleClear}
              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:underline text-xs font-bold"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:underline text-xs font-bold"
            >
              Hoje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
