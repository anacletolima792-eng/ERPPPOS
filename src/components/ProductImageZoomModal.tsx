import React, { useEffect } from 'react';

interface ProductImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName?: string;
  productCode?: string;
  productPrice?: number;
  productStock?: number;
  productUnit?: string;
  categoryName?: string;
  onAddToCart?: () => void;
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productName = 'Foto do Produto',
}) => {
  // Fecha com a tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      id="product-image-zoom-overlay"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none cursor-pointer transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      title="Clique em qualquer lugar para fechar"
    >
      {/* 
        Container da imagem: 
        Na lista a miniatura mede 40px no mobile (w-10 h-10) e 44px no desktop (w-11 h-11).
        4 vezes esse tamanho resulta exatamente em 160px no mobile (h-40) e 176px no sm/desktop (h-44),
        mantendo a proporção natural da foto sem distorcer e cantos arredondados idênticos à referência.
      */}
      <div
        className="relative flex items-center justify-center cursor-pointer animate-in zoom-in-95 duration-150"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={productName}
          referrerPolicy="no-referrer"
          className="h-40 sm:h-44 w-auto max-w-[280px] sm:max-w-[320px] object-cover rounded-2xl shadow-2xl ring-1 ring-white/15 drop-shadow-2xl"
          draggable={false}
        />
      </div>
    </div>
  );
};
