import React, { useState } from 'react';
import { X, ScanLine, Search, Plus, Check, Camera, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const { addItem } = useCart();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  if (!isOpen) return null;

  const handleLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    const found = products.find((p) => {
      const pBarcode = (p.barcode || '').toLowerCase();
      const pCode = (p.code || '').toLowerCase();
      return (
        pBarcode === clean ||
        pCode === clean ||
        pCode === `#${clean}` ||
        `#${pCode}` === clean
      );
    });

    if (found) {
      addItem(found, 1);
      setLastScanned(found);
      setErrorMessage(null);
      setBarcodeInput('');
    } else {
      setErrorMessage(`Nenhum produto encontrado com o código "${code}".`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleLookup(barcodeInput);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
        <div
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Leitor de Código de Barras</h2>
                <p className="text-xs text-slate-500 font-medium">Câmera do celular ou leitor laser</p>
              </div>
            </div>
            <button
              id="btn-close-scanner"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Direct Camera Button */}
            <button
              type="button"
              id="btn-open-camera-pos"
              onClick={() => setIsCameraActive(true)}
              className="w-full py-3.5 px-4 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm">Abrir Câmera do Celular para Bipar</span>
            </button>

            {/* Scanner Simulation Box */}
            <div className="relative h-24 bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-white overflow-hidden p-3 border-2 border-orange-500/40 shadow-inner">
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
              <ScanLine className="w-7 h-7 text-orange-400 mb-1 opacity-80" />
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider text-center">
                Aguardando leitura óptica ou digitação
              </span>
            </div>

            {/* Barcode input form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="input-barcode-scanner"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Ex: 7891234560018 ou #00018"
                  autoFocus
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  id="btn-submit-barcode"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Bipar
                </button>
              </div>
            </form>

            {errorMessage && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                {errorMessage}
              </p>
            )}

            {lastScanned && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-950 uppercase">{lastScanned.name}</p>
                    <p className="text-[11px] text-emerald-700">{formatCurrency(lastScanned.price)} • +1 Adicionado!</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  No Carrinho
                </span>
              </div>
            )}

            {/* Quick test barcodes */}
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                Produtos com Código de Barras (Clique para testar bip)
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {products.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLookup(p.barcode || p.code)}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{p.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {p.barcode || p.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Barcode Scanner for POS */}
      <CameraBarcodeScannerModal
        isOpen={isCameraActive}
        onClose={() => setIsCameraActive(false)}
        onScan={(code) => {
          handleLookup(code);
        }}
        title="Bipar Produto com a Câmera"
        subtitle="Aponte a câmera para o código de barras para adicionar automaticamente ao carrinho"
      />
    </>
  );
};
