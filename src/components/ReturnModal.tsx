import React, { useState } from 'react';
import { X, RotateCcw, ArrowRight, CheckCircle2, AlertCircle, PackageCheck, Wallet } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import { processReturnTransaction } from '../services/firestoreService';
import { PaymentMethod, Sale } from '../types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (returnedSale: Sale) => void;
}

const COMMON_REASONS = [
  'Troca de produto',
  'Produto com defeito / avaria',
  'Arrependimento / Desistência',
  'Comprado por engano / tamanho errado',
  'Outro motivo',
];

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { items, customer, subtotal, total, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('dinheiro');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const effectiveReason = selectedReason === 'Outro motivo' && customReasonText.trim()
    ? customReasonText.trim()
    : selectedReason;

  const handleConfirmReturn = async () => {
    if (items.length === 0) {
      setErrorMessage('Nenhum item no carrinho para devolução.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const returnedSale = await processReturnTransaction({
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        customerId: customer?.id,
        customerName: customer?.name || 'Consumidor Final (Balcão)',
        items,
        subtotal,
        total,
        paymentMethod: refundMethod,
        returnReason: effectiveReason,
        notes: notes.trim() || undefined,
      });

      clearCart();
      onSuccess(returnedSale);
      onClose();
    } catch (err: any) {
      console.error('Erro ao processar devolução:', err);
      setErrorMessage(err?.message || 'Ocorreu um erro ao processar a devolução.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-200 bg-amber-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Devolução de Produtos</h2>
              <p className="text-xs text-amber-900/80 font-medium">
                Retorno imediato ao estoque e registro de estorno
              </p>
            </div>
          </div>

          <button
            id="btn-close-return-modal"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Banner: Stock Restoration Info */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <p className="font-bold">
                {totalQuantity} {totalQuantity === 1 ? 'item será reposto' : 'itens serão repostos'} ao estoque
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                A quantidade dos produtos listados abaixo será automaticamente incrementada no saldo do sistema.
              </p>
            </div>
          </div>

          {/* List of items being returned */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Produtos a Devolver ({items.length})
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate uppercase">{item.product.name}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                      <span>Cód: {item.product.code}</span>
                      <span>•</span>
                      <span>{formatCurrency(item.unitPrice)} cada</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-[11px] mb-0.5">
                      +{item.quantity} {item.product.unit || 'UN'}
                    </span>
                    <p className="font-extrabold text-slate-800">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Motivo da Devolução
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`p-2 rounded-xl text-xs text-left font-medium border transition-all cursor-pointer ${
                    selectedReason === reason
                      ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason === 'Outro motivo' && (
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Descreva o motivo da devolução..."
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            )}
          </div>

          {/* Refund Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Forma de Estorno / Reembolso ao Cliente
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'dinheiro', label: 'Dinheiro' },
                { id: 'pix', label: 'PIX' },
                { id: 'debito', label: 'Débito' },
                { id: 'credito', label: 'Crédito' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRefundMethod(m.id as PaymentMethod)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    refundMethod === m.id
                      ? 'bg-slate-900 text-white border-slate-950 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Observações Adicionais (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente apresentou cupom fiscal anterior..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Total Refund Highlight */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Total a Estornar ao Cliente
              </span>
              <span className="text-2xl font-black text-amber-950">{formatCurrency(total)}</span>
            </div>
            <div className="text-right text-xs text-amber-900 font-medium">
              <span>Cliente:</span>
              <p className="font-bold truncate max-w-[160px]">{customer?.name || 'Consumidor Final'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            id="btn-cancel-return"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-confirm-return-stock"
            onClick={handleConfirmReturn}
            disabled={isProcessing || items.length === 0}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Atualizando Estoque...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                <span>Confirmar Devolução e Repor Estoque</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
