import React from 'react';
import { LayoutGrid, ShoppingCart, Package, FileText, Menu } from 'lucide-react';
import { NavTab } from '../types';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

interface BottomNavProps {
  activeTab?: NavTab;
  currentTab?: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, currentTab, onTabChange }) => {
  const { itemCount } = useCart();
  const { isAdmin } = useAuth();
  const current = activeTab || currentTab || 'pdv';

  // Se o operador for um vendedor (não admin), exibe estritamente as abas PDV e VENDAS
  if (!isAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 sm:h-20 flex items-center justify-around px-4 sm:px-12 shadow-sm pb-safe transition-colors">
        <div className="max-w-md mx-auto w-full flex items-center justify-around h-full gap-4">
          {/* 1. PDV */}
          <button
            type="button"
            id="nav-tab-pdv"
            onClick={() => onTabChange('pdv')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors rounded-xl py-1 ${
              current === 'pdv'
                ? 'text-blue-600 dark:text-blue-400 font-black bg-blue-50/50 dark:bg-blue-950/40'
                : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white dark:border-slate-900 shadow-xs">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">PDV</span>
          </button>

          {/* 2. Vendas */}
          <button
            type="button"
            id="nav-tab-vendas"
            onClick={() => onTabChange('sales')}
            className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors rounded-xl py-1 ${
              current === 'sales'
                ? 'text-blue-600 dark:text-blue-400 font-black bg-blue-50/50 dark:bg-blue-950/40'
                : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">Vendas</span>
          </button>
        </div>
      </nav>
    );
  }

  // Visualização total exclusiva para o Administrador (5 abas completas)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 sm:h-20 flex items-center justify-around px-4 sm:px-10 shadow-sm pb-safe transition-colors">
      <div className="max-w-xl mx-auto w-full flex items-center justify-around h-full">
        {/* 1. Início (Dashboard) */}
        <button
          type="button"
          id="nav-tab-inicio"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            current === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
        </button>

        {/* 2. PDV */}
        <button
          type="button"
          id="nav-tab-pdv"
          onClick={() => onTabChange('pdv')}
          className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            current === 'pdv'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white dark:border-slate-900 shadow-xs">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">PDV</span>
        </button>

        {/* 3. Estoque */}
        <button
          type="button"
          id="nav-tab-estoque"
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            current === 'inventory'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <Package className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Estoque</span>
        </button>

        {/* 4. Vendas */}
        <button
          type="button"
          id="nav-tab-vendas"
          onClick={() => onTabChange('sales')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            current === 'sales'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Vendas</span>
        </button>

        {/* 5. Mais */}
        <button
          type="button"
          id="nav-tab-mais"
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            current === 'more'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Mais</span>
        </button>
      </div>
    </nav>
  );
};
