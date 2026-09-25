import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, UserPlus, ShoppingBag, ArrowRight, Percent, RotateCcw, FileText } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { ReturnModal } from './ReturnModal';
import { CurrencyInput } from './CurrencyInput';
import { QuantityStepper } from './QuantityStepper';
import { QuoteModal } from './QuoteModal';
import { Product, Sale } from '../types';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  onOpenCustomerSelect: () => void;
  onReturnCompleted?: (returnedSale: Sale) => void;
  products?: Product[];
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  onOpenCustomerSelect,
  onReturnCompleted,
  products = [],
}) => {
  const {
    items,
    customer,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    total,
    globalDiscount,
    setGlobalDiscount,
    updateItemDiscount,
  } = useCart();

  const [discountInput, setDiscountInput] = useState<number>(globalDiscount > 0 ? globalDiscount : 0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleApplyDiscount = () => {
    if (discountInput >= 0) {
      setGlobalDiscount(Math.min(subtotal, discountInput));
      setShowDiscountInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] h-[90vh] sm:h-auto overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Carrinho de Compras</h2>
              <p className="text-xs text-slate-500 font-medium">
                {items.length} {items.length === 1 ? 'produto adicionado' : 'produtos adicionados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                id="btn-header-quote"
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Transformar este pedido em Orçamento comercial"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-extrabold">Orçamento</span>
              </button>
            )}

            {items.length > 0 && (
              <button
                id="btn-clear-cart"
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-bold p-2 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
                title="Limpar Carrinho"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer Badge & Quote Action in Cart */}
        <div className="px-4 sm:px-5 py-2.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs text-blue-950 dark:text-blue-300 font-medium shrink-0">Cliente:</span>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate" title={customer?.name || 'Consumidor Final (Balcão)'}>
              {customer?.name || 'Consumidor Final (Balcão)'}
            </span>
            <button
              id="btn-cart-change-customer"
              type="button"
              onClick={onOpenCustomerSelect}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-700 shadow-2xs shrink-0 cursor-pointer"
            >
              Alterar
            </button>
          </div>

          {items.length > 0 ? (
            <button
              id="btn-cart-transform-quote-badge"
              type="button"
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg font-black text-xs flex items-center gap-1.5 shadow-xs shrink-0 transition-all cursor-pointer"
              title="Transformar este pedido em Orçamento formal com impressão e envio"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Orçamento</span>
            </button>
          ) : (
            <button
              id="btn-cart-view-quotes-badge"
              type="button"
              onClick={() => setIsQuoteModalOpen(true)}
              className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
              title="Ver orçamentos salvos"
            >
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>Ver Orçamentos</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-16 h-16 mx-auto stroke-1 text-slate-300 mb-3" />
              <p className="font-bold text-slate-700 text-base">Seu carrinho está vazio</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Selecione produtos no PDV ou use a busca por nome/código para adicionar ao pedido.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate uppercase">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium">{formatCurrency(item.unitPrice)} / {item.product.unit || 'UN'}</span>
                    <span>•</span>
                    <span className="font-bold text-blue-950">{formatCurrency(item.total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity Stepper with editable input and -/+ buttons */}
                  <QuantityStepper
                    id={`stepper-drawer-${item.product.id}`}
                    value={item.quantity}
                    onChange={(newQty) => updateQuantity(item.product.id, newQty)}
                    min={0}
                    size="md"
                    colorScheme="blue"
                  />

                  {/* Remove Item */}
                  <button
                    id={`btn-drawer-remove-${item.product.id}`}
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout Action */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Discount Row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-slate-800 font-bold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                id="btn-toggle-discount"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                {globalDiscount > 0 ? `Desconto Aplicado (-${formatCurrency(globalDiscount)})` : '+ Adicionar Desconto'}
              </button>
              {globalDiscount > 0 && (
                <span className="font-bold text-red-600">-{formatCurrency(globalDiscount)}</span>
              )}
            </div>

            {showDiscountInput && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex-1">
                  <CurrencyInput
                    id="input-cart-discount"
                    value={discountInput}
                    onChange={(val) => setDiscountInput(val)}
                    placeholder="0,00"
                    className="w-full py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
                <button
                  id="btn-apply-discount"
                  onClick={handleApplyDiscount}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shrink-0"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Total Display */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-black tracking-wider block">
                  Total dos Itens
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                  {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'itens'} no carrinho
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Action Buttons: DEVOLUÇÃO & COBRAR */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5 pt-1">
              <button
                id="btn-drawer-return"
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="col-span-2 h-12 sm:h-13 bg-amber-50 hover:bg-amber-100/90 active:scale-98 text-amber-900 border border-amber-300 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Devolução de produtos ao estoque e estorno"
              >
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.2]" />
                <span className="tracking-wide">DEVOLUÇÃO</span>
              </button>

              <button
                id="btn-drawer-proceed-checkout"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="col-span-3 h-12 sm:h-13 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white border border-transparent rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                <span className="tracking-wider">COBRAR</span>
                <ArrowRight className="w-4 h-4 shrink-0 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Modal de Devolução ao Estoque */}
        <ReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={(returnedSale) => {
            setIsReturnModalOpen(false);
            onClose();
            onReturnCompleted?.(returnedSale);
          }}
        />

        {/* Modal de Orçamento */}
        <QuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          onOpenCheckout={() => {
            setIsQuoteModalOpen(false);
            onClose();
            onOpenCheckout();
          }}
          products={products}
        />
      </div>
    </div>
  );
};
