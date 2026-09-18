import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { getStoredSales, getStoredData, STORAGE_KEYS, DEFAULT_STORE_SETTINGS } from '../services/firestoreService';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { decodeReceiptHash } from '../utils/printReceiptHelper';

interface PrintReceiptViewProps {
  saleId: string;
  onClose?: () => void;
}

export const PrintReceiptView: React.FC<PrintReceiptViewProps> = ({ saleId, onClose }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialWidth = (urlParams.get('width') as '80mm' | '58mm') || '80mm';

  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(initialWidth);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [printed, setPrinted] = useState(false);

  // Initialize sale from hash (instant, independent of storage or origin), or local storage
  const [sale, setSale] = useState<Sale | null>(() => {
    // 1. URL Hash payload (cross-origin / partitioned iframe safe)
    if (typeof window !== 'undefined' && window.location.hash) {
      const payload = decodeReceiptHash(window.location.hash);
      if (payload?.sale) {
        return payload.sale;
      }
    }

    // 2. SessionStorage
    try {
      const cached = sessionStorage.getItem('pdv_current_print_sale');
      if (cached) {
        const parsed = JSON.parse(cached) as Sale;
        if (parsed.id === saleId || parsed.saleNumber === saleId) {
          return parsed;
        }
      }
    } catch (e) {}

    // 3. Local sales list
    try {
      const sales = getStoredSales();
      const found = sales.find((s) => s.id === saleId || s.saleNumber === saleId);
      if (found) return found;
    } catch (e) {}

    return null;
  });

  // Store settings initialization
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const payload = decodeReceiptHash(window.location.hash);
      if (payload?.settings) {
        return payload.settings;
      }
    }
    return getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
  });

  // If sale was not in hash or local storage, fetch from Firestore
  useEffect(() => {
    if (!sale && saleId) {
      setIsLoading(true);
      const fetchFromFirestore = async () => {
        try {
          // 1. Try doc ID
          const docRef = doc(db, 'sales', saleId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setSale(snap.data() as Sale);
            setIsLoading(false);
            return;
          }

          // 2. Try saleNumber query
          const q = query(collection(db, 'sales'), where('saleNumber', '==', saleId), limit(1));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            setSale(querySnap.docs[0].data() as Sale);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Erro ao carregar venda do Firestore para impressão:', err);
        }
        setIsLoading(false);
      };

      fetchFromFirestore();
    }
  }, [sale, saleId]);

  // Trigger print dialog ONLY when sale is loaded and running in a dedicated window/tab
  useEffect(() => {
    if (!sale || isLoading) return;

    document.body.classList.add('printing-dedicated');

    // Only auto-trigger print dialog if opened in a dedicated browser tab/window (never inside a sandboxed preview iframe)
    const isDedicatedTab = typeof window !== 'undefined' && window.self === window.top;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isDedicatedTab) {
      timer = setTimeout(() => {
        try {
          window.print();
          setPrinted(true);
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 500);
    }

    return () => {
      document.body.classList.remove('printing-dedicated');
      if (timer) clearTimeout(timer);
    };
  }, [sale, isLoading]);

  const handlePrint = () => {
    try {
      window.print();
      setPrinted(true);
    } catch (e) {
      console.warn('Print error:', e);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (window.opener) {
      window.close();
    } else {
      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch {}
      window.location.href = window.location.pathname;
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">Carregando Comprovante...</h2>
          <p className="text-xs text-slate-500">Buscando detalhes da venda para emissão do cupom.</p>
        </div>
      </div>
    );
  }

  // 2. Not Found State (Only if fetch finished and sale is still null)
  if (!sale) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Cupom não localizado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Não foi possível carregar os dados desta venda (ID: {saleId}).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar de novo</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Voltar ao PDV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isReturned = sale.status === 'returned';
  const targetWidth = paperWidth === '80mm' ? '78mm' : '56mm';
  const fontSize = paperWidth === '80mm' ? '11px' : '9.5px';

  return (
    <div className="print-wrapper min-h-screen bg-slate-100 flex flex-col items-center py-6 px-3">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden w-full max-w-lg mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Voltar ao PDV"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xs font-bold text-slate-900">Cupom #{sale.saleNumber}</h1>
            <span className="text-[10px] text-slate-500">{formatDate(sale.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2 py-1 rounded-md text-[10px] cursor-pointer transition-colors ${
                paperWidth === '80mm' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2 py-1 rounded-md text-[10px] cursor-pointer transition-colors ${
                paperWidth === '58mm' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              58mm
            </button>
          </div>

          <button
            type="button"
            id="btn-trigger-print"
            onClick={handlePrint}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{printed ? 'Imprimir Novamente' : 'Imprimir Cupom'}</span>
          </button>
        </div>
      </div>

      {/* Printable Thermal Receipt Container */}
      <div
        id="printable-receipt-card"
        style={{
          width: targetWidth,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize,
          lineHeight: '1.3',
        }}
        className="bg-white text-black p-3 sm:p-4 rounded-xl shadow-md print:shadow-none print:rounded-none print:p-0 mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-1.5">
          <div className="text-sm font-black uppercase tracking-tight">
            {storeSettings?.storeName || 'MEU ESTABELECIMENTO'}
          </div>
          {storeSettings?.cnpj && <div className="text-[10px]">CNPJ: {storeSettings.cnpj}</div>}
          {storeSettings?.address && <div className="text-[10px]">{storeSettings.address}</div>}
          {storeSettings?.phone && <div className="text-[10px]">Tel: {storeSettings.phone}</div>}
          <div className="mt-1 font-bold text-[10px] tracking-wider">
            {isReturned ? '*** COMPROVANTE DE DEVOLUÇÃO ***' : '*** CUPOM NÃO FISCAL ***'}
          </div>
        </div>

        <div className="border-t border-dashed border-black my-1" />

        <div className="flex justify-between text-[10px]">
          <span>DOC: #{sale.saleNumber}</span>
          <span>{formatDate(sale.createdAt)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>OP: {sale.operatorName}</span>
          <span>CLI: {sale.customerName || 'Consumidor Final'}</span>
        </div>
        {isReturned && sale.returnReason && (
          <div className="text-[10px] mt-0.5">
            <strong>MOTIVO:</strong> {sale.returnReason}
          </div>
        )}

        <div className="border-t border-dashed border-black my-1" />

        <div className="flex justify-between font-bold text-[10px] mb-0.5">
          <span>{isReturned ? 'ITEM REPOSTO / DESCRIÇÃO' : 'QTD ITEM / DESCRIÇÃO'}</span>
          <span>TOTAL</span>
        </div>

        <div className="border-t border-dashed border-black my-1" />

        {/* Items */}
        <div className="space-y-1">
          {sale.items.map((item, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="font-bold truncate">{item.productName}</div>
              <div className="flex justify-between">
                <span>
                  {item.quantity} {item.unit || 'UN'} x {formatCurrency(item.unitPrice)}
                  {item.discount > 0 ? ` (-${formatCurrency(item.discount)})` : ''}
                </span>
                <span className="font-bold">{formatCurrency(item.total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-1" />

        <div className="flex justify-between text-[10px]">
          <span>QTD TOTAL ITENS:</span>
          <span>{sale.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>DESCONTO:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs font-black my-1 py-1 border-t border-b border-black">
          <span>{isReturned ? 'TOTAL ESTORNADO:' : 'TOTAL A PAGAR:'}</span>
          <span>{isReturned ? `- ${formatCurrency(sale.total)}` : formatCurrency(sale.total)}</span>
        </div>

        <div className="flex justify-between text-[10px]">
          <span>{isReturned ? 'FORMA ESTORNO:' : 'FORMA PGTO:'}</span>
          <span className="font-bold uppercase">{sale.paymentMethod}</span>
        </div>

        {!isReturned && sale.paymentMethod === 'dinheiro' && (
          <>
            <div className="flex justify-between text-[10px]">
              <span>VALOR RECEBIDO:</span>
              <span>{formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span>TROCO:</span>
              <span>{formatCurrency(sale.change)}</span>
            </div>
          </>
        )}

        {sale.notes && <div className="text-[10px] mt-1">Obs: {sale.notes}</div>}

        <div className="border-t border-dashed border-black my-1" />

        {/* Footer */}
        <div className="text-center mt-2 text-[10px] space-y-0.5">
          <p>
            {isReturned
              ? 'Itens repostos ao estoque com sucesso.'
              : storeSettings?.receiptFooter || 'Obrigado pela preferência! Volte sempre.'}
          </p>
          <p className="text-[9px] text-gray-500">Sistema ERP/PDV Express</p>
        </div>
      </div>
    </div>
  );
};
