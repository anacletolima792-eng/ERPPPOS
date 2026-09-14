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
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraBarcodeScannerModal: React.FC<
  CameraBarcodeScannerModalProps
> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras',
  subtitle = 'Aponte a câmera do celular para o código de barras ou EAN do produto',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const scannerContainerId = 'interactive-camera-barcode-scanner';

  // Play audio beep on scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleSuccessfulScan = (decodedText: string) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;

    playBeep();
    setScannedCode(cleanText);

    // Stop scanning
    stopCamera();

    // Small delay to show visual checkmark before closing
    setTimeout(() => {
      onScan(cleanText);
      onClose();
    }, 450);
  };

  const startCamera = async () => {
    if (isStartingRef.current || html5QrCodeRef.current) return;

    setCameraError(null);
    setScannedCode(null);
    isStartingRef.current = true;

    try {
      // Check if scanner element exists
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
          handleSuccessfulScan(decodedText);
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
      console.warn('Camera barcode start error:', err);
      isStartingRef.current = false;
      setIsScanning(false);
      const errMsg =
        err?.message ||
        'Não foi possível acessar a câmera do aparelho. Verifique as permissões de câmera do seu navegador.';
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

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM container is rendered
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessfulScan(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Câmera do Celular / Leitor Óptico
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-camera-scanner"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
          {/* HTML5 QR Code Mount Element */}
          <div
            id={scannerContainerId}
            className="w-full h-full min-h-[280px] [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Overlay Visual Laser & Frame Guide (when scanning) */}
          {isScanning && !scannedCode && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Aiming Reticle */}
              <div className="relative w-64 h-36 sm:w-72 sm:h-40 border-2 border-orange-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                {/* Animated Laser Beam */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
              </div>

              <span className="mt-4 text-xs font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 shadow-md">
                Centralize o código de barras no quadro
              </span>
            </div>
          )}

          {/* Success Scanned Banner */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
              <h4 className="text-base font-black text-emerald-200">
                Código Lido com Sucesso!
              </h4>
              <p className="text-xl font-mono font-black text-white mt-1 bg-emerald-900/80 px-4 py-1.5 rounded-xl border border-emerald-500/40">
                {scannedCode}
              </p>
            </div>
          )}

          {/* Camera Error / Permission Fallback */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-white mb-1">
                Acesso à Câmera Não Disponível
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Permita o uso da câmera no navegador ou digite/bipe o código
                manualmente abaixo.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Digitar Código</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Camera Controls Toolbar (Torch) */}
          {isScanning && hasTorch && (
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900/80 text-white hover:bg-slate-800'
                }`}
                title={isTorchOn ? 'Desligar lanterna' : 'Ligar lanterna'}
              >
                {isTorchOn ? (
                  <Zap className="w-4 h-4 fill-current" />
                ) : (
                  <ZapOff className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Instructions & Manual Digitation Section */}
        <div className="p-4 sm:p-5 bg-white space-y-3">
          <p className="text-xs text-slate-600 font-medium text-center">
            {subtitle}
          </p>

          {/* Manual Input Toggle / Form */}
          <div className="pt-2 border-t border-slate-100">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                id="input-camera-manual-barcode"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ou digite o código (ex: 7891234560020)..."
                className="flex-1 px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                id="btn-apply-manual-barcode"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Inserir
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
