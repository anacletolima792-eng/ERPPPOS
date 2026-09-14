import React from 'react';
import { ShoppingBag, ArrowRight, DollarSign } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';

interface ActionBannerProps {
  onOpenCart: () => void;
  onOpenCheckout: () => void;
}

export const ActionBanner: React.FC<ActionBannerProps> = ({ onOpenCart, onOpenCheckout }) => {
  const { itemCount, total, items, lastAddedItem } = useCart();
  const hasItems = items.length > 0 && !!lastAddedItem;

  return (
    <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Cart Preview Card */}
        <button
          id="btn-cart-summary-card"
          onClick={onOpenCart}
          className="flex-1 flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group cursor-pointer"
          title={hasItems && lastAddedItem ? `Último item adicionado: ${lastAddedItem.product.name} - Clique para abrir o carrinho` : 'Carrinho vazio'}
        >
          {/* Badge box */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 transition-all ${
              hasItems
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-500'
            }`}
          >
            {hasItems && lastAddedItem ? lastAddedItem.quantity : 0}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span
                className="text-xs font-bold text-slate-800 truncate block group-hover:text-blue-600 transition-colors"
                title={lastAddedItem?.product.name}
              >
                {hasItems && lastAddedItem
                  ? lastAddedItem.product.name
                  : 'Nenhum item adicionado'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black text-blue-600 block">
                {hasItems && lastAddedItem
                  ? formatCurrency(lastAddedItem.total)
                  : 'R$ 0,00'}
              </span>
              {hasItems && lastAddedItem && lastAddedItem.quantity > 1 && (
                <span className="text-[11px] font-semibold text-slate-500">
                  ({lastAddedItem.quantity}x {formatCurrency(lastAddedItem.unitPrice)})
                </span>
              )}
            </div>
          </div>
        </button>

        {/* High Density Emerald Cobrar Button */}
        <button
          id="btn-cobrar-action"
          onClick={() => {
            if (hasItems) {
              onOpenCheckout();
            } else {
              onOpenCart();
            }
          }}
          className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-black text-sm sm:text-base flex items-center gap-2 sm:gap-3 transition-all shrink-0 shadow-lg active:scale-95 cursor-pointer ${
            hasItems
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 ring-2 ring-emerald-500/30'
              : 'bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-left">
            <span className="text-xs sm:text-sm tracking-wider uppercase font-black">COBRAR</span>
            <span className="text-xs sm:text-sm font-bold opacity-90">({formatCurrency(total)})</span>
          </div>
        </button>
      </div>
    </div>
  );
};
