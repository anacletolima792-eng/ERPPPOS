import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ChevronDown, Calendar as CalendarIcon, Check } from 'lucide-react';
import { DateFilterConfig } from './DateFilterModal';
import { formatDateOnly } from '../utils/formatters';

interface CalendarPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: DateFilterConfig;
  onApply: (filter: DateFilterConfig) => void;
  align?: 'left' | 'right';
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

export const CalendarPickerPopover: React.FC<CalendarPickerPopoverProps> = ({
  isOpen,
  onClose,
  currentFilter,
  onApply,
  align = 'right',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Helper to get local YYYY-MM-DD
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

  // Determine initial view year and month
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
  const [viewMonth, setViewMonth] = useState<number>(initialYM.month); // 0-11
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  // Selection mode: 'single' | 'range'
  const [mode, setMode] = useState<'single' | 'range'>(
    currentFilter.type === 'custom_range' ? 'range' : 'single'
  );

  // Selected state
  const [selectedDate, setSelectedDate] = useState<string>(
    currentFilter.customDate || (currentFilter.type === 'today' ? getTodayStr() : '')
  );
  const [rangeStart, setRangeStart] = useState<string>(currentFilter.customRangeStart || '');
  const [rangeEnd, setRangeEnd] = useState<string>(currentFilter.customRangeEnd || '');

  // Reset/sync when opened
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

  const [xOffset, setXOffset] = useState<number>(0);

  // Auto-adjust horizontal position so the popover is never cut off by screen edges
  useEffect(() => {
    if (!isOpen) {
      setXOffset(0);
      return;
    }

    const adjustPosition = () => {
      if (!popoverRef.current) return;
      const el = popoverRef.current;
      // Temporarily remove transform to measure natural DOM layout bounds
      const prevTransform = el.style.transform;
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      el.style.transform = prevTransform;

      const margin = 10;
      const viewportWidth = window.innerWidth;

      let shift = 0;
      // If right edge extends past viewport margin, shift leftwards
      if (rect.right > viewportWidth - margin) {
        shift = (viewportWidth - margin) - rect.right;
      }
      // If that shift pushes past left margin (or if initially past left), clamp to left margin
      if (rect.left + shift < margin) {
        shift = margin - rect.left;
      }

      setXOffset(Math.round(shift));
    };

    // Calculate immediately and on next frame to ensure accurate layout
    adjustPosition();
    const animId = requestAnimationFrame(adjustPosition);
    window.addEventListener('resize', adjustPosition);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', adjustPosition);
    };
  }, [isOpen, align]);

  // Click outside listener (handles both desktop mouse and mobile touch)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const targetNode = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(targetNode)) {
        // If clicking on the trigger button, let the button's own click handler toggle it
        const trigger = document.getElementById('period-tab-all');
        if (trigger && trigger.contains(targetNode)) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  // Calendar matrix calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Total 42 cells (6 rows x 7 days)
  interface CalendarDayCell {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
  }

  const cells: CalendarDayCell[] = [];

  // Trailing previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  // Leading next month days
  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Day click logic
  const handleDayClick = (dateStr: string) => {
    if (mode === 'single') {
      setSelectedDate(dateStr);
      onApply({
        type: 'custom_day',
        customDate: dateStr,
      });
      onClose();
    } else {
      // Range mode
      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new range
        setRangeStart(dateStr);
        setRangeEnd('');
      } else {
        // Complete range
        if (dateStr < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        } else {
          setRangeEnd(dateStr);
        }
      }
    }
  };

  const handleApplyRange = () => {
    if (!rangeStart) return;
    const start = rangeStart;
    const end = rangeEnd || rangeStart;
    const sortedStart = start <= end ? start : end;
    const sortedEnd = start <= end ? end : start;

    onApply({
      type: 'custom_range',
      customRangeStart: sortedStart,
      customRangeEnd: sortedEnd,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedDate('');
    setRangeStart('');
    setRangeEnd('');
    onApply({
      type: 'all',
    });
    onClose();
  };

  const handleToday = () => {
    const todayStr = getTodayStr();
    setSelectedDate(todayStr);
    const [y, m] = todayStr.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    onApply({
      type: 'today',
      customDate: todayStr,
      customMonth: getMonthStr(),
    });
    onClose();
  };

  // Helper to determine day cell styling
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

  // Year options for quick select (current year - 5 to current year + 5)
  const currentYearNow = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYearNow - 5; y <= currentYearNow + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div
      ref={popoverRef}
      id="calendar-picker-popover"
      className={`absolute z-50 top-full mt-1.5 ${
        align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0'
      } bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-[290px] sm:w-[310px] max-w-[calc(100vw-20px)] p-3 text-slate-900 select-none animate-in fade-in duration-100 font-sans`}
      style={{
        boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        transform: xOffset ? `translateX(${xOffset}px)` : undefined,
      }}
    >
      {/* Optional Mode Toggle Header: Single Day vs Interval */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] font-bold">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
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
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              mode === 'range'
                ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Intervalo (Período)
          </button>
        </div>

        {mode === 'range' && (
          <span className="text-[10px] text-blue-600 font-semibold truncate">
            {rangeStart && rangeEnd
              ? `${formatDateOnly(rangeStart)} - ${formatDateOnly(rangeEnd)}`
              : rangeStart
              ? 'Clique na data final'
              : 'Clique na data inicial'}
          </span>
        )}
      </div>

      {/* If Range mode is active, show the input boxes for Data de Início e Data Final */}
      {mode === 'range' && (
        <div className="grid grid-cols-2 gap-2 mb-2.5 pb-2.5 border-b border-slate-100 text-[11px]">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
              Data Início
            </label>
            <input
              type="date"
              id="input-popover-range-start"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
              Data Final
            </label>
            <input
              type="date"
              id="input-popover-range-end"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Calendar Header: "setembro de 2026 ▾" and arrows ↑ ↓ */}
      <div className="flex items-center justify-between px-1 py-1 mb-2 relative">
        {/* Month Year Selector */}
        <div className="relative">
          <button
            type="button"
            id="btn-calendar-month-toggle"
            onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
            className="flex items-center gap-1 text-sm font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer py-0.5 rounded"
          >
            <span>
              {MONTH_NAMES_PT[viewMonth]} de {viewYear}
            </span>
            <span className="text-xs">▾</span>
          </button>

          {/* Quick Month / Year Dropdown */}
          {isMonthSelectOpen && (
            <div className="absolute top-full left-0 mt-1 z-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-48 text-xs animate-in fade-in">
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

        {/* Up and Down Arrows (↑ and ↓) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-calendar-prev-month"
            onClick={handlePrevMonth}
            title="Mês anterior"
            className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            id="btn-calendar-next-month"
            onClick={handleNextMonth}
            title="Próximo mês"
            className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Weekday Row: D S T Q Q S S */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEK_DAYS.map((wd, i) => (
          <div
            key={`${wd}-${i}`}
            className="text-xs font-semibold text-slate-800 py-1"
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

      {/* If Range mode is active and dates are chosen, show Apply button */}
      {mode === 'range' && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            id="btn-apply-range-filter"
            onClick={handleApplyRange}
            disabled={!rangeStart}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              rangeStart
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {rangeStart && rangeEnd
                ? `Aplicar Intervalo (${formatDateOnly(rangeStart)} até ${formatDateOnly(rangeEnd)})`
                : rangeStart
                ? `Aplicar Período (${formatDateOnly(rangeStart)})`
                : 'Selecione as datas'}
            </span>
          </button>
        </div>
      )}

      {/* Bottom Actions: Limpar (left) & Hoje (right) */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 px-1 text-sm font-medium">
        <button
          type="button"
          id="btn-calendar-clear"
          onClick={handleClear}
          className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:underline text-[13px]"
        >
          Limpar
        </button>

        <button
          type="button"
          id="btn-calendar-today"
          onClick={handleToday}
          className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer hover:underline text-[13px]"
        >
          Hoje
        </button>
      </div>
    </div>
  );
};
