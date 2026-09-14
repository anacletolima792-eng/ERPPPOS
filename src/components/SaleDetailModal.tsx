import React, { useState } from 'react';
import { X, Printer, Ban, AlertTriangle, FileText, CheckCircle2, User, RotateCcw, PackageCheck } from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cancelSale } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: (sale: Sale) => void;
  onSaleUpdated?: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  sale,
  isOpen,
  onClose,
  onOpenReceipt,
  onSaleUpdated,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!isOpen || !sale) return null;

  const isCanceled = sale.status === 'canceled';
  const isReturned = sale.status === 'returned';

  const handleConfirmCancel = async () => {
    try {
      setIsCanceling(true);
      await cancelSale(sale, currentUser.name, cancelReason || 'Cancelamento solicitado pelo administrador');
      onSaleUpdated?.();
      setShowCancelPrompt(false);
      onClose();
    } catch (err) {
      console.error('Erro ao cancelar venda:', err);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold ${
                isReturned ? 'bg-amber-500' : 'bg-blue-600'
              }`}
            >
              {isReturned ? <RotateCcw className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-base">
                  {isReturned ? `Devolução #${sale.saleNumber}` : `Venda #${sale.saleNumber}`}
                </h2>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                    isCanceled
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : isReturned
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {isCanceled ? 'Cancelada' : isReturned ? 'Devolução' : 'Concluída'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{formatDate(sale.createdAt)}</p>
            </div>
          </div>
          <button
            id="btn-close-sale-detail"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status summary */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Operador / Caixa</span>
              <span className="font-bold text-slate-800">{sale.operatorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Cliente</span>
              <span className="font-bold text-slate-800">{sale.customerName || 'Balcão'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Forma de Pagamento</span>
              <span className="font-bold text-slate-800 uppercase">{sale.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isReturned ? 'Total Estornado' : 'Total da Venda'}
              </span>
              <span className={`font-black text-sm ${isReturned ? 'text-amber-700' : 'text-slate-950'}`}>
                {isReturned ? `- ${formatCurrency(sale.total)}` : formatCurrency(sale.total)}
              </span>
            </div>
          </div>

          {isReturned && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <PackageCheck className="w-4 h-4 text-amber-600" />
                <span>Devolução concluída — os itens foram repostos ao estoque.</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Registrado por: <span className="font-semibold">{sale.operatorName}</span> em {formatDate(sale.createdAt)}
              </p>
              {sale.returnReason && (
                <p className="text-[11px] font-medium bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200/80">
                  Motivo: <span className="font-bold">{sale.returnReason}</span>
                </p>
              )}
            </div>
          )}

          {isCanceled && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Esta venda foi cancelada e o estoque foi estornado.</span>
              </div>
              <p className="text-[11px] text-red-700">
                Cancelado por: <span className="font-semibold">{sale.canceledBy || 'Admin'}</span> em {formatDate(sale.canceledAt)}
              </p>
              {sale.cancelReason && (
                <p className="text-[11px] italic">Motivo: "{sale.cancelReason}"</p>
              )}
            </div>
          )}

          {/* Items Table */}
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Itens da Venda ({sale.items.length})
            </span>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {sale.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{item.productName}</span>
                    <span className="text-slate-500 text-[11px]">
                      {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}
                      {item.discount > 0 && ` • desc: -${formatCurrency(item.discount)}`}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-800">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Desconto Aplicado</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {isAdmin && (sale.totalCost > 0 || (sale.items && sale.items.some(i => i.costPrice > 0))) && (
              <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                  <span>Custo dos Produtos (CMV):</span>
                  <span>{formatCurrency(sale.totalCost || sale.items.reduce((acc, i) => acc + (i.costPrice || 0) * i.quantity, 0))}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                  <span>Lucro Bruto Estimado:</span>
                  <span>
                    {formatCurrency(
                      sale.total - (sale.totalCost || sale.items.reduce((acc, i) => acc + (i.costPrice || 0) * i.quantity, 0))
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cancel prompt if triggered */}
          {showCancelPrompt && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Confirmar cancelamento da venda?
              </h4>
              <p className="text-xs text-red-700">
                Esta ação devolverá automaticamente todos os itens ao estoque e marcará a venda como cancelada.
              </p>
              <input
                type="text"
                placeholder="Motivo do cancelamento (opcional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-red-300 rounded-lg focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-red-100/60 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCanceling}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {isCanceling ? 'Estornando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {!isCanceled && !isReturned && isAdmin && !showCancelPrompt && (
            <button
              type="button"
              id="btn-cancel-sale-trigger"
              onClick={() => setShowCancelPrompt(true)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancelar Venda</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onOpenReceipt(sale)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isReturned ? 'Ver Comprovante de Devolução' : 'Ver / Re-imprimir Cupom'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
