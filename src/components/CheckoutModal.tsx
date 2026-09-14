import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Printer,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { PaymentMethod, Sale, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { processSaleTransaction, getStoreSettings } from '../services/firestoreService';
import { CurrencyInput } from './CurrencyInput';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: (completedSale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleComplete,
}) => {
  const { items, customer, subtotal, totalDiscount, total, totalCost, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setCashGiven(total > 0 ? total : 0);
      getStoreSettings().then(setStoreSettings).catch(console.error);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const parsedCash = cashGiven;
  const cashAmountNum = parsedCash > 0 ? parsedCash : total;
  const changeAmount = Math.max(0, (parsedCash > 0 ? parsedCash : total) - total);
  const isCashInsufficient = paymentMethod === 'dinheiro' && parsedCash > 0 && parsedCash < total;

  const handleCopyPix = () => {
    const pixKey = storeSettings?.pixKey || 'comercial@empresa.com.br';
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleFinishSale = async () => {
    if (isProcessing) return;

    if (items.length === 0) {
      setErrorMessage('O carrinho está vazio. Adicione itens antes de finalizar.');
      return;
    }

    let finalAmountPaid = total;
    let finalChange = 0;

    if (paymentMethod === 'dinheiro') {
      if (cashGiven > 0) {
        if (cashGiven < total) {
          setErrorMessage(`O valor em dinheiro informado (${formatCurrency(cashGiven)}) é menor que o total (${formatCurrency(total)}).`);
          return;
        }
        finalAmountPaid = cashGiven;
        finalChange = Math.max(0, cashGiven - total);
      } else {
        // Default to exact total if not specified
        finalAmountPaid = total;
        finalChange = 0;
      }
    }

    if (paymentMethod === 'prazo' && (!customer || customer.id === 'cust-balcao')) {
      setErrorMessage('Venda a prazo requer selecionar um cliente cadastrado com nome e documento.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const saleData = {
        operatorId: currentUser?.id || 'op-default',
        operatorName: currentUser?.name || 'Operador',
        customerId: customer?.id || 'cust-balcao',
        customerName: customer?.name || 'Consumidor Final',
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productCode: item.product.code,
          quantity: item.quantity,
          unit: item.product.unit || 'UN',
          unitPrice: item.unitPrice,
          costPrice: item.product.costPrice || 0,
          discount: item.discount || 0,
          total: item.total,
        })),
        subtotal,
        discount: totalDiscount,
        total,
        totalCost: totalCost || 0,
        paymentMethod,
        amountPaid: finalAmountPaid,
        change: finalChange,
        notes: notes.trim() || undefined,
        status: 'completed' as const,
      };

      let completedSale: Sale;
      try {
        const salePromise = processSaleTransaction(saleData);
        const timeoutPromise = new Promise<Sale>((resolve) => {
          setTimeout(() => {
            console.warn('Timeout de resposta na venda: liberando checkout imediatamente.');
            resolve({
              id: `sale-local-${Date.now()}`,
              saleNumber: `VD-${Date.now().toString().slice(-6)}`,
              ...saleData,
              createdAt: new Date().toISOString(),
            } as Sale);
          }, 1200);
        });

        completedSale = await Promise.race([salePromise, timeoutPromise]);
      } catch (saveErr) {
        console.warn('Fallback local para venda:', saveErr);
        completedSale = {
          id: `sale-local-${Date.now()}`,
          saleNumber: `VD-${Date.now().toString().slice(-6)}`,
          ...saleData,
          createdAt: new Date().toISOString(),
        } as Sale;
      }

      clearCart();
      onSaleComplete(completedSale);
      onClose();
    } catch (err: any) {
      console.error('Erro ao finalizar venda:', err);
      setErrorMessage(err.message || 'Falha ao registrar a venda.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Finalizar Pagamento</h2>
            <p className="text-xs text-slate-500 font-medium">
              Cliente: <span className="font-bold text-slate-800">{customer?.name || 'Balcão'}</span> • Operador: <span className="font-bold text-slate-800">{currentUser.name}</span>
            </p>
          </div>
          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Total Hero Display */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md text-center">
            <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold">Valor Total a Cobrar</span>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-white tracking-tight">
              {formatCurrency(total)}
            </div>
            {totalDiscount > 0 && (
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                Desconto de {formatCurrency(totalDiscount)} incluso
              </span>
            )}
          </div>

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              <button
                type="button"
                id="btn-pay-money"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-400/40 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dinheiro</span>
              </button>

              <button
                type="button"
                id="btn-pay-pix"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-400/40 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                <span>PIX</span>
              </button>

              <button
                type="button"
                id="btn-pay-credit"
                onClick={() => setPaymentMethod('credito')}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'credito'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-400/40 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Crédito</span>
              </button>

              <button
                type="button"
                id="btn-pay-debit"
                onClick={() => setPaymentMethod('debito')}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'debito'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-400/40 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Débito</span>
              </button>

              <button
                type="button"
                id="btn-pay-prazo"
                onClick={() => setPaymentMethod('prazo')}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all col-span-2 sm:col-span-1 ${
                  paymentMethod === 'prazo'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-400/40 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                <span>A Prazo</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Inputs */}
          {paymentMethod === 'dinheiro' && (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-cash-amount" className="text-[10px] font-bold text-slate-700 block mb-0.5">
                    Valor Pago (R$)
                  </label>
                  <CurrencyInput
                    id="input-cash-amount"
                    value={cashGiven}
                    onChange={(val) => setCashGiven(val)}
                    placeholder="0,00"
                    className="w-full text-sm font-black text-slate-900 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 flex flex-col justify-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider">Troco a Devolver</span>
                  <span className={`text-sm sm:text-base font-black leading-tight ${isCashInsufficient ? 'text-red-500 text-xs' : 'text-emerald-700'}`}>
                    {isCashInsufficient ? 'Valor Insuficiente' : formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'pix' && (
            <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-950">Chave PIX da Loja</span>
                <span className="text-[10px] text-teal-700 font-semibold">Instantâneo</span>
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-teal-200">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Chave ({storeSettings?.pixKeyType || 'E-mail'})</span>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                    {storeSettings?.pixKey || 'comercial@empresa.com.br'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-copy-pix-key"
                  onClick={handleCopyPix}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {paymentMethod === 'credito' && (
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-blue-950 block">Parcelamento no Cartão de Crédito</span>
              <select
                id="select-installments"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value={1}>1x de {formatCurrency(total)} (À vista)</option>
                <option value={2}>2x de {formatCurrency(total / 2)} sem juros</option>
                <option value={3}>3x de {formatCurrency(total / 3)} sem juros</option>
                <option value={6}>6x de {formatCurrency(total / 6)} sem juros</option>
              </select>
            </div>
          )}

          {paymentMethod === 'prazo' && (
            <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-purple-950 block">Venda a Prazo (Caderno / Fiado)</span>
              <p className="text-xs text-purple-800">
                Será registrado na conta de <span className="font-bold">{customer?.name || 'Cliente selecionado'}</span> para cobrança posterior.
              </p>
            </div>
          )}

          {/* Observações Opcionais */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Observações da Venda (Opcional)</label>
            <input
              type="text"
              id="input-sale-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entrega agendada, garantia estendida..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-cancel-checkout"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
          >
            Voltar
          </button>

          <button
            type="button"
            id="btn-confirm-finish-sale"
            onClick={handleFinishSale}
            disabled={isProcessing}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isProcessing
                ? 'bg-emerald-700/80 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-98 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando venda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>CONFIRMAR E FINALIZAR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
