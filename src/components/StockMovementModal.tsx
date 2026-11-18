import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  PackagePlus,
  PackageMinus,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { adjustProductStock } from '../services/firestoreService';
import { QuantityStepper } from './QuantityStepper';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [movementType, setMovementType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMovementType('add');
      setQuantity(1);
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const curStock = product.stock || 0;
  const delta = movementType === 'add' ? quantity : -quantity;
  const targetStock = Math.max(0, curStock + delta);

  const handleApply = async () => {
    if (quantity <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await adjustProductStock(product.id, delta);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Erro ao ajustar estoque:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-blue-50/90 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Image 2 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
              Movimentação de Estoque
            </span>
            {product.name && (
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate hidden xs:inline">
                • {product.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer shrink-0 ml-2"
          >
            Fechar
          </button>
        </div>

        {/* Operation Toggle: Adicionar vs Retirar matching Image 2 */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => setMovementType('add')}
            className={`py-1.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              movementType === 'add'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Adicionar (Entrada)</span>
          </button>

          <button
            type="button"
            onClick={() => setMovementType('remove')}
            className={`py-1.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              movementType === 'remove'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <PackageMinus className="w-3.5 h-3.5" />
            <span>- Retirar (Saída)</span>
          </button>
        </div>

        {/* Amount to move */}
        <div className="mb-2.5">
          <QuantityStepper
            id="stepper-stock-modal-qty"
            value={quantity}
            onChange={(val) => setQuantity(Math.max(1, val))}
            min={1}
            size="md"
            className="w-full"
          />
        </div>

        {/* Calculation preview & Apply matching Image 2 */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Novo Estoque: </span>
            <strong className="font-bold text-slate-700 dark:text-slate-300">{curStock}</strong>
            <span
              className={
                movementType === 'add'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold mx-1'
                  : 'text-rose-600 dark:text-rose-400 font-bold mx-1'
              }
            >
              {movementType === 'add' ? `+ ${quantity}` : `- ${quantity}`}
            </span>
            <span>= </span>
            <strong
              className={`text-sm font-black ${
                movementType === 'add'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {targetStock} {product.unit || 'UN'}
            </strong>
          </div>

          <button
            type="button"
            disabled={isSubmitting || quantity <= 0}
            onClick={handleApply}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Aplicar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
