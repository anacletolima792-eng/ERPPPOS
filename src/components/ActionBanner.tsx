import React from 'react';
import { DollarSign } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';

interface ActionBannerProps {
  onOpenCart: () => void;
  onOpenCheckout: () => void;
}

export const ActionBanner: React.FC<ActionBannerProps> = ({ onOpenCart, onOpenCheckout }) => {
  const { total, items, lastAddedItem } = useCart();
  const hasItems = items.length > 0 && !!lastAddedItem;

  return (
    <div className="px-3 py-2 sm:px-6 sm:py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3 h-12 sm:h-14">
        {/* Left Cart Preview Card - fixed height to prevent any vertical shift */}
        <button
          type="button"
          id="btn-cart-summary-card"
          onClick={onOpenCart}
          className="flex-1 min-w-0 h-full flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left group cursor-pointer overflow-hidden"
          title={hasItems && lastAddedItem ? `Último item adicionado: ${lastAddedItem.product.name} - Clique para abrir o carrinho` : 'Carrinho vazio'}
        >
          {/* Badge box with fixed size */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shrink-0 transition-colors ${
              hasItems
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'
            }`}
          >
            {hasItems && lastAddedItem ? lastAddedItem.quantity : 0}
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <span
              className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight uppercase"
              title={lastAddedItem?.product.name}
            >
              {hasItems && lastAddedItem
                ? lastAddedItem.product.name
                : 'Nenhum item adicionado'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden leading-tight">
              <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 truncate">
                {hasItems && lastAddedItem
                  ? formatCurrency(lastAddedItem.total)
                  : 'R$ 0,00'}
              </span>
              {hasItems && lastAddedItem && lastAddedItem.quantity > 1 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  ({lastAddedItem.quantity}x {formatCurrency(lastAddedItem.unitPrice)})
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Fixed Position and Fixed Width Cobrar Button */}
        <button
          type="button"
          id="btn-cobrar-action"
          onClick={() => {
            if (hasItems) {
              onOpenCheckout();
            } else {
              onOpenCart();
            }
          }}
          className={`w-36 sm:w-44 md:w-48 h-full rounded-xl font-black flex items-center justify-center gap-1.5 sm:gap-2 px-3 transition-colors shrink-0 shadow-md cursor-pointer ${
            hasItems
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-emerald-600/85 hover:bg-emerald-600 text-white shadow-slate-200'
          }`}
          title={hasItems ? `Cobrar total: ${formatCurrency(total)}` : 'Abrir carrinho para cobrar'}
        >
          <DollarSign className="w-5 h-5 shrink-0 stroke-[2.5]" />
          <div className="flex flex-col justify-center text-left min-w-0 leading-tight">
            <span className="text-xs sm:text-sm tracking-wider uppercase font-black truncate">
              COBRAR
            </span>
            <span className="text-[11px] sm:text-xs font-bold opacity-90 truncate font-mono">
              ({formatCurrency(total)})
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
