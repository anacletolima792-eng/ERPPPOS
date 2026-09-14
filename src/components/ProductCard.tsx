import React, { useState } from 'react';
import { Package, Plus, Check, ZoomIn } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks/useCart';
import { QuantityStepper } from './QuantityStepper';
import { ProductImageZoomModal } from './ProductImageZoomModal';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, viewMode = 'list' }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const cartItem = items.find((item) => item.product.id === product.id);
  const inCartQty = cartItem?.quantity || 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (!isOutOfStock) {
      addItem(product, 1);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (product.imageUrl) {
      e.stopPropagation();
      setIsZoomOpen(true);
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
        <div
          id={`product-card-${product.id}`}
          onClick={handleCardClick}
          className={`group bg-white dark:bg-slate-900 rounded-xl border p-3 shadow-xs transition-all flex flex-col justify-between ${
            inCartQty > 0
              ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500 bg-blue-50/20 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
          } ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
        >
          <div>
            {/* Image */}
            <div
              onClick={handleImageClick}
              className={`aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 relative overflow-hidden group/img ${
                product.imageUrl ? 'cursor-zoom-in' : ''
              }`}
              title={product.imageUrl ? 'Clique para ampliar a foto' : undefined}
            >
              {product.imageUrl ? (
                <>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle Zoom Hint on Hover */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-md">
                      <ZoomIn className="w-4 h-4" />
                    </span>
                  </div>
                </>
              ) : (
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              )}

              {isOutOfStock && (
                <span className="absolute bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  SEM ESTOQUE
                </span>
              )}

              {inCartQty > 0 && !isOutOfStock && (
                <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {inCartQty}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{product.code}</div>
            <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">
              {formatCurrency(product.price)}
            </span>

            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isOutOfStock
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                  : isLowStock
                  ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              EST: {product.stock}
            </span>
          </div>
        </div>

        {/* Product Image Zoom Modal */}
        {isZoomOpen && product.imageUrl && (
          <ProductImageZoomModal
            isOpen={isZoomOpen}
            onClose={() => setIsZoomOpen(false)}
            imageUrl={product.imageUrl}
            productName={product.name}
            productCode={product.code}
            productPrice={product.price}
            productStock={product.stock}
            productUnit={product.unit}
            categoryName={product.categoryName}
            onAddToCart={!isOutOfStock ? () => addItem(product, 1) : undefined}
          />
        )}
      </>
    );
  }

  // Default List Card (High Density row)
  return (
    <>
      <div
        id={`product-card-${product.id}`}
        onClick={handleCardClick}
        className={`group relative flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border transition-all ${
          inCartQty > 0
            ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500 bg-blue-50/20 dark:bg-blue-950/30 shadow-xs'
            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs'
        } ${isOutOfStock ? 'opacity-70 bg-slate-50 dark:bg-slate-850' : 'cursor-pointer active:scale-[0.99]'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Product Image */}
          <div
            onClick={handleImageClick}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative group/img ${
              product.imageUrl ? 'cursor-zoom-in hover:ring-2 hover:ring-blue-400' : ''
            }`}
            title={product.imageUrl ? 'Clique para ampliar a foto' : undefined}
          >
            {product.imageUrl ? (
              <>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {/* Subtle zoom hint overlay on hover */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
                </div>
              </>
            ) : (
              <Package className="w-5 h-5 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
            )}

            {inCartQty > 0 && (
              <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center text-white font-black text-xs">
                {inCartQty}x
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">#{product.code}</span>
              {product.categoryName && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline truncate">
                  • {product.categoryName}
                </span>
              )}
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-0.5">
              {product.name}
            </h3>

            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isOutOfStock
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    : isLowStock
                    ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                EST: {product.stock} {product.unit || 'UN'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Price & Add Action */}
        <div
          className="flex items-center gap-2 pl-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            {formatCurrency(product.price)}
          </span>

          {/* Stepper or Add button */}
          {inCartQty > 0 ? (
            <QuantityStepper
              id={`stepper-card-${product.id}`}
              value={inCartQty}
              onChange={(newQty) => updateQuantity(product.id, newQty)}
              min={0}
              size="sm"
              colorScheme="blue"
            />
          ) : (
            <button
              id={`btn-add-product-${product.id}`}
              onClick={() => addItem(product, 1)}
              disabled={isOutOfStock}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                isOutOfStock
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-800 hover:border-blue-600 active:scale-90 shadow-xs'
              }`}
              title="Adicionar ao carrinho"
            >
              <Plus className="w-4 h-4 font-bold" />
            </button>
          )}
        </div>
      </div>

      {/* Product Image Zoom Modal */}
      {isZoomOpen && product.imageUrl && (
        <ProductImageZoomModal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          imageUrl={product.imageUrl}
          productName={product.name}
          productCode={product.code}
          productPrice={product.price}
          productStock={product.stock}
          productUnit={product.unit}
          categoryName={product.categoryName}
          onAddToCart={!isOutOfStock ? () => addItem(product, 1) : undefined}
        />
      )}
    </>
  );
};
