import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, UserPlus, ShoppingBag, ArrowRight, Percent, RotateCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { ReturnModal } from './ReturnModal';
import { CurrencyInput } from './CurrencyInput';
import { QuantityStepper } from './QuantityStepper';
import { Sale } from '../types';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  onOpenCustomerSelect: () => void;
  onReturnCompleted?: (returnedSale: Sale) => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  onOpenCustomerSelect,
  onReturnCompleted,
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

          <div className="flex items-center gap-1">
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

        {/* Customer Badge in Cart */}
        <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-blue-950 font-medium">Cliente:</span>
            <span className="text-xs font-bold text-blue-900 truncate">
              {customer?.name || 'Consumidor Final (Balcão)'}
            </span>
          </div>
          <button
            id="btn-cart-change-customer"
            onClick={onOpenCustomerSelect}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs"
          >
            Alterar
          </button>
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

            {/* Total Row & Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block truncate">Total dos Itens</span>
                <span className="text-xl font-black text-slate-950">{formatCurrency(total)}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-drawer-return"
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="px-3 sm:px-4 py-3.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Devolução de produtos ao estoque e estorno"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>DEVOLUÇÃO</span>
                </button>

                <button
                  id="btn-drawer-proceed-checkout"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCheckout();
                  }}
                  className="px-4 sm:px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer"
                >
                  <span>PAGAMENTO</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
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
      </div>
    </div>
  );
};
