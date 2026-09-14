import React from 'react';
import { LayoutGrid, ShoppingCart, Package, FileText, Menu } from 'lucide-react';
import { NavTab } from '../types';
import { useCart } from '../hooks/useCart';

interface BottomNavProps {
  activeTab?: NavTab;
  currentTab?: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, currentTab, onTabChange }) => {
  const { itemCount } = useCart();
  const current = activeTab || currentTab || 'pdv';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 h-16 sm:h-20 flex items-center justify-around px-4 sm:px-10 shadow-sm pb-safe">
      <div className="max-w-xl mx-auto w-full flex items-center justify-around h-full">
        {/* 1. Início (Dashboard) */}
        <button
          id="nav-tab-inicio"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
            current === 'dashboard'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
        </button>

        {/* 2. PDV */}
        <button
          id="nav-tab-pdv"
          onClick={() => onTabChange('pdv')}
          className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
            current === 'pdv'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">PDV</span>
        </button>

        {/* 3. Estoque */}
        <button
          id="nav-tab-estoque"
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
            current === 'inventory'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <Package className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Estoque</span>
        </button>

        {/* 4. Vendas */}
        <button
          id="nav-tab-vendas"
          onClick={() => onTabChange('sales')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
            current === 'sales'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Vendas</span>
        </button>

        {/* 5. Mais */}
        <button
          id="nav-tab-mais"
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
            current === 'more'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Mais</span>
        </button>
      </div>
    </nav>
  );
};
