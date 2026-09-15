import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  SwitchCamera,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsTorchOn(false);
    setHasTorch(false);
  };

  const startStream = async (targetFacing: 'environment' | 'user' = facingMode) => {
    stopStream();
    setError(null);
    setCapturedPreview(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador ou dispositivo.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Detect torch / flash capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      }
    } catch (err: any) {
      console.error('Erro ao abrir câmera:', err);
      let message = 'Não foi possível acessar a câmera do celular.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Nenhuma câmera encontrada no dispositivo.';
      }
      setError(message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startStream(facingMode);
    } else {
      stopStream();
      setCapturedPreview(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextTorch = !isTorchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Erro ao alternar lanterna:', err);
    }
  };

  const switchFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const targetSize = 640; // Optimize dimensions for fast load & Firestore storage
      
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      // Crop center square
      const minDim = Math.min(vWidth, vHeight);
      const startX = (vWidth - minDim) / 2;
      const startY = (vHeight - minDim) / 2;

      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          video,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        // Quality 0.85 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPreview(dataUrl);
      }
    } catch (err) {
      console.error('Erro ao capturar foto:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const confirmPhoto = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      stopStream();
      onClose();
    }
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    } else {
      startStream(facingMode);
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className="bg-slate-950 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-white max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                Tirar Foto do Produto
              </h3>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                {capturedPreview ? 'Confirme ou repita a foto' : 'Enquadre o produto no centro'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!capturedPreview && hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title={isTorchOn ? 'Desligar flash' : 'Ligar flash'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {!capturedPreview && (
              <button
                type="button"
                onClick={switchFacingMode}
                className="p-1.5 bg-slate-800 hover:text-white text-slate-300 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Trocar de câmera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              id="btn-close-camera-capture"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex flex-col items-center justify-center aspect-square w-full overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-slate-300 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Câmera Indisponível</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">{error}</p>
              <button
                type="button"
                onClick={() => startStream(facingMode)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : capturedPreview ? (
            <div className="w-full h-full relative">
              <img
                src={capturedPreview}
                alt="Foto capturada"
                className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-150"
              />
              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-emerald-600/90 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                Foto Capturada
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Center Framing Guide Grid */}
              <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                <div className="w-full h-full border border-white/40 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-orange-500 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-orange-500 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-orange-500 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-orange-500 rounded-br-md" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-8 h-8 border border-white/50 rounded-full" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-around gap-3">
          {capturedPreview ? (
            <>
              <button
                type="button"
                id="btn-retake-product-photo"
                onClick={retakePhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                id="btn-confirm-product-photo"
                onClick={confirmPhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Usar Foto</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center py-1">
              <button
                type="button"
                id="btn-shutter-product-photo"
                onClick={takePhoto}
                disabled={isCapturing || !!error}
                className="w-16 h-16 rounded-full border-4 border-white/30 p-1 flex items-center justify-center hover:border-orange-500 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                title="Tirar Foto"
              >
                <div className="w-full h-full bg-orange-500 hover:bg-orange-400 rounded-full flex items-center justify-center shadow-md">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
