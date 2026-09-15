import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  ScanLine,
  Zap,
  ZapOff,
  RefreshCw,
  AlertTriangle,
  Keyboard,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';

interface CleanCameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const CleanCameraBarcodeScannerModal: React.FC<CleanCameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const { addItem } = useCart();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const scannerContainerId = 'clean-camera-barcode-viewport';
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio beep on scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleLookupAndAdd = (rawCode: string) => {
    const clean = rawCode.trim().toLowerCase();
    if (!clean) return;

    playBeep();
    setScannedCode(rawCode);

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
      setLastScannedProduct(found);
      setNotFoundCode(null);
      // Auto close after brief confirmation feedback
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, 700);
    } else {
      setNotFoundCode(rawCode);
      setLastScannedProduct(null);
    }
  };

  const startCamera = async () => {
    if (isStartingRef.current || html5QrCodeRef.current) return;

    setCameraError(null);
    setScannedCode(null);
    setNotFoundCode(null);
    isStartingRef.current = true;

    try {
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        isStartingRef.current = false;
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.min(viewfinderWidth * 0.85, 340);
          const height = Math.min(viewfinderHeight * 0.55, 180);
          return { width, height };
        },
        aspectRatio: 1.333334,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleLookupAndAdd(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);
      isStartingRef.current = false;

      // Check for torch capability
      try {
        const track = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
        if (track && 'torch' in track) {
          setHasTorch(true);
        }
      } catch {
        // Torch capability not detected
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      isStartingRef.current = false;
      setIsScanning(false);
      const errMsg =
        err?.message ||
        'Não foi possível acessar a câmera do aparelho. Verifique as permissões de câmera do navegador.';
      setCameraError(errMsg);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setIsTorchOn(false);
        setHasTorch(false);
      }
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning) return;
    try {
      const newTorchState = !isTorchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  const handleClose = async () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    await stopCamera();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        try {
          html5QrCodeRef.current.clear();
        } catch {
          // ignore clear errors on unmount
        }
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleLookupAndAdd(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Minimal Header */}
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                Câmera / Bipar Produto
              </h3>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                Aponte para o código de barras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isScanning && hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
                  isTorchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title={isTorchOn ? 'Desligar lanterna' : 'Ligar lanterna'}
              >
                {isTorchOn ? (
                  <Zap className="w-4 h-4 fill-current" />
                ) : (
                  <ZapOff className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              id="btn-close-clean-scanner"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Camera Viewport Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] h-[340px] overflow-hidden">
          {/* HTML5 QR Code Mount Element */}
          <div
            id={scannerContainerId}
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Clean Reticle & Laser Beam */}
          {isScanning && !lastScannedProduct && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-64 h-36 border border-orange-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-orange-500 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-orange-500 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-orange-500 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-orange-500 rounded-br-md" />

                {/* Animated Laser Beam */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
              </div>
            </div>
          )}

          {/* Success Product Feedback Banner */}
          {lastScannedProduct && (
            <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-lg">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                {lastScannedProduct.name}
              </h4>
              <p className="text-emerald-300 font-extrabold text-sm mt-0.5">
                {formatCurrency(lastScannedProduct.price)} • +1 Adicionado ao Carrinho!
              </p>
            </div>
          )}

          {/* Product Not Found Alert */}
          {notFoundCode && !lastScannedProduct && (
            <div className="absolute bottom-3 inset-x-3 bg-red-900/90 text-white p-2.5 rounded-xl border border-red-500/50 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
              <div>
                <p className="font-bold">Código não cadastrado:</p>
                <p className="font-mono text-red-200 text-[11px]">{notFoundCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotFoundCode(null)}
                className="px-2 py-1 bg-red-800 hover:bg-red-700 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Camera Permission / Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-white mb-1">
                Acesso à Câmera Não Concedido
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mb-3">
                Autorize a câmera no navegador ou digite o código abaixo.
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          )}
        </div>

        {/* Clean Manual Input Bar (Quick fallback without visual clutter) */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              id="input-quick-camera-barcode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Digitar código ou leitor USB..."
              className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-hidden focus:border-orange-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              id="btn-quick-camera-submit"
              disabled={!manualCode.trim()}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Bipar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
