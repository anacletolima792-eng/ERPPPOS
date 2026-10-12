import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { DateFilterConfig } from './DateFilterModal';
import { CalendarPickerPopover } from './CalendarPickerPopover';
import { formatDateOnly } from '../utils/formatters';

interface DateFilterBarProps {
  currentFilter: DateFilterConfig;
  onFilterChange: (newFilter: DateFilterConfig) => void;
  className?: string;
  alignPopover?: 'left' | 'right';
  compact?: boolean;
  pill?: boolean;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  currentFilter,
  onFilterChange,
  className = '',
  alignPopover = 'right',
  compact = false,
  pill = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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

  const isCustomActive =
    currentFilter.type.startsWith('custom') || currentFilter.type === 'all';

  const getTudoButtonLabel = () => {
    if (currentFilter.type === 'custom_day' && currentFilter.customDate) {
      return formatDateOnly(currentFilter.customDate);
    }
    if (
      currentFilter.type === 'custom_range' &&
      currentFilter.customRangeStart &&
      currentFilter.customRangeEnd
    ) {
      const s = formatDateOnly(currentFilter.customRangeStart);
      const e = formatDateOnly(currentFilter.customRangeEnd);
      return `${s.slice(0, 5)} - ${e.slice(0, 5)}`;
    }
    if (currentFilter.type === 'custom_month' && currentFilter.customMonth) {
      const [, m] = currentFilter.customMonth.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months[Number(m) - 1] || 'Mês';
    }
    return 'Tudo';
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`flex ${
          pill
            ? 'bg-white dark:bg-slate-800 p-0.5 sm:p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700'
        } ${compact ? 'text-[11px]' : 'text-xs'} font-bold items-center gap-0.5 sm:gap-1`}
      >
        {/* Tab 1: Hoje */}
        <button
          type="button"
          id="period-tab-today"
          onClick={() => {
            setIsPopoverOpen(false);
            onFilterChange({
              type: 'today',
              customDate: getTodayStr(),
              customMonth: getMonthStr(),
            });
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${
            pill ? 'rounded-full' : 'rounded-lg'
          } transition-all cursor-pointer ${
            currentFilter.type === 'today'
              ? 'bg-blue-600 text-white shadow-2xs font-black'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          Hoje
        </button>

        {/* Tab 2: Mês */}
        <button
          type="button"
          id="period-tab-month"
          onClick={() => {
            setIsPopoverOpen(false);
            onFilterChange({
              type: 'month',
              customDate: getTodayStr(),
              customMonth: getMonthStr(),
            });
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${
            pill ? 'rounded-full' : 'rounded-lg'
          } transition-all cursor-pointer ${
            currentFilter.type === 'month'
              ? 'bg-blue-600 text-white shadow-2xs font-black'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          Mês
        </button>

        {/* Tab 3: Tudo / Calendário popover */}
        <button
          type="button"
          id="period-tab-all"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          title="Clique para escolher qualquer data, intervalo de datas ou todo o histórico"
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${
            pill
              ? 'rounded-full border border-blue-200/90 dark:border-blue-800'
              : 'rounded-lg'
          } transition-all cursor-pointer flex items-center gap-1.5 ${
            isCustomActive
              ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold shadow-2xs ring-1 ring-blue-300 dark:ring-blue-800'
              : isPopoverOpen
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-extrabold ring-1 ring-blue-400/50'
              : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="whitespace-nowrap text-blue-700 dark:text-blue-300 font-bold">{getTudoButtonLabel()}</span>
          <ChevronDown
            className={`w-3 h-3 text-blue-600 dark:text-blue-400 opacity-80 shrink-0 transition-transform duration-200 ${
              isPopoverOpen ? 'rotate-180 opacity-100' : ''
            }`}
          />
        </button>
      </div>

      {/* Popover Calendar */}
      <CalendarPickerPopover
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        currentFilter={currentFilter}
        onApply={(filter) => {
          onFilterChange(filter);
        }}
        align={alignPopover}
      />
    </div>
  );
};
