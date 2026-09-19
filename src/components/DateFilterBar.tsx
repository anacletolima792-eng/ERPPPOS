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
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  currentFilter,
  onFilterChange,
  className = '',
  alignPopover = 'right',
  compact = false,
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
      <div className={`flex bg-slate-100 p-1 rounded-xl border border-slate-200 ${compact ? 'text-[11px]' : 'text-xs'} font-bold items-center`}>
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
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            currentFilter.type === 'today'
              ? 'bg-blue-600 text-white shadow-2xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            currentFilter.type === 'month'
              ? 'bg-blue-600 text-white shadow-2xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Mês
        </button>

        {/* Tab 4: Tudo / Calendário popover */}
        <button
          type="button"
          id="period-tab-all"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          title="Clique para escolher qualquer data, intervalo de datas ou todo o histórico"
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            isCustomActive
              ? 'bg-blue-600 text-white shadow-2xs font-black'
              : isPopoverOpen
              ? 'bg-white text-blue-700 shadow-2xs font-extrabold ring-1 ring-blue-400/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{getTudoButtonLabel()}</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 shrink-0 transition-transform duration-200 ${
              isPopoverOpen ? 'rotate-180 text-blue-600 opacity-100' : ''
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
