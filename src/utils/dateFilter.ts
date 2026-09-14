import { Sale } from '../types';
import { DateFilterConfig } from '../components/DateFilterModal';
import { formatDateOnly, formatMonthYear } from './formatters';

export const filterSalesByDate = (sales: Sale[], dateFilter: DateFilterConfig): Sale[] => {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = String(now.getMonth() + 1).padStart(2, '0');
  const todayD = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayY}-${todayM}-${todayD}`;
  const currentMonthStr = `${todayY}-${todayM}`;

  return sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    if (isNaN(saleDate.getTime())) return true;

    const y = saleDate.getFullYear();
    const m = String(saleDate.getMonth() + 1).padStart(2, '0');
    const d = String(saleDate.getDate()).padStart(2, '0');
    const saleDayStr = `${y}-${m}-${d}`;
    const saleMonthStr = `${y}-${m}`;

    if (dateFilter.type === 'today') {
      return saleDayStr === todayStr;
    }
    if (dateFilter.type === '7days') {
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateFilter.type === 'month') {
      return saleMonthStr === currentMonthStr;
    }
    if (dateFilter.type === 'custom_day' && dateFilter.customDate) {
      return saleDayStr === dateFilter.customDate;
    }
    if (dateFilter.type === 'custom_month' && dateFilter.customMonth) {
      return saleMonthStr === dateFilter.customMonth;
    }
    if (dateFilter.type === 'custom_range') {
      const start = dateFilter.customRangeStart || '';
      const end = dateFilter.customRangeEnd || start;
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;
      return saleDayStr >= s && saleDayStr <= e;
    }
    return true; // 'all'
  });
};

export const getDateFilterLabel = (filter: DateFilterConfig): string => {
  if (filter.type === 'today') return 'Hoje';
  if (filter.type === '7days') return 'Últimos 7 Dias';
  if (filter.type === 'month') {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `Mês Atual (${formatMonthYear(`${y}-${m}`)})`;
  }
  if (filter.type === 'custom_day' && filter.customDate) {
    return `Dia ${formatDateOnly(filter.customDate)}`;
  }
  if (filter.type === 'custom_month' && filter.customMonth) {
    return `Mês ${formatMonthYear(filter.customMonth)}`;
  }
  if (filter.type === 'custom_range' && filter.customRangeStart) {
    const end = filter.customRangeEnd || filter.customRangeStart;
    return `${formatDateOnly(filter.customRangeStart)} até ${formatDateOnly(end)}`;
  }
  return 'Todo o Histórico';
};
