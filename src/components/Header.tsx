import React from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenOperatorModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenCheckout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenOperatorModal,
  onOpenCustomerModal,
}) => {
  const { currentUser, companyName } = useAuth();
  const { customer } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Operator Selector */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            id="btn-operator-switch"
            onClick={onOpenOperatorModal}
            className="w-full flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors text-left group shadow-2xs"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[11px] text-white font-black shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                  {currentUser.name}
                </span>
                {companyName && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block leading-tight">
                    {companyName}
                  </span>
                )}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
          </button>
        </div>

        {/* Customer Selector */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            id="btn-customer-select"
            onClick={onOpenCustomerModal}
            className="w-full flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors text-left group shadow-2xs"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {customer?.name || 'Consumidor Final'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {customer?.document ? (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {customer.document}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Padrão
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </div>
          </button>
        </div>

        {/* Light / Dark Mode Toggle */}
        <div className="shrink-0">
          <ThemeToggle id="header-theme-toggle" />
        </div>
      </div>
    </header>
  );
};
