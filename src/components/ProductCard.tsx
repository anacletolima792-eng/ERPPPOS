import React from 'react';
import { Package, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks/useCart';
import { QuantityStepper } from './QuantityStepper';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, viewMode = 'list' }) => {
  const { items, addItem, updateQuantity } = useCart();
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

  if (viewMode === 'grid') {
    return (
      <div
        id={`product-card-${product.id}`}
        onClick={handleCardClick}
        className={`group bg-white rounded-xl border p-3 shadow-xs transition-all flex flex-col justify-between ${
          inCartQty > 0
            ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/20'
            : 'border-slate-200 hover:border-blue-300'
        } ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
      >
        <div>
          {/* Image */}
          <div className="aspect-square bg-slate-100 rounded-lg mb-2.5 flex items-center justify-center text-slate-300 relative overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-slate-300 stroke-[1.5]" />
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

          <div className="text-xs text-slate-400 font-mono">#{product.code}</div>
          <div className="font-bold text-slate-800 leading-tight mb-1 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-blue-600 font-bold text-sm sm:text-base">
            {formatCurrency(product.price)}
          </span>

          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isOutOfStock
                ? 'bg-red-100 text-red-700'
                : isLowStock
                ? 'bg-orange-100 text-orange-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            EST: {product.stock}
          </span>
        </div>
      </div>
    );
  }

  // Default List Card (High Density row)
  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between px-3 py-2 bg-white rounded-xl border transition-all ${
        inCartQty > 0
          ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/20 shadow-xs'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
      } ${isOutOfStock ? 'opacity-70 bg-slate-50' : 'cursor-pointer active:scale-[0.99]'}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Product Image */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Package className="w-5 h-5 text-slate-400 stroke-[1.5]" />
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
            <span className="text-[10px] text-slate-400 font-mono">#{product.code}</span>
            {product.categoryName && (
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline truncate">
                • {product.categoryName}
              </span>
            )}
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-tight truncate leading-snug group-hover:text-blue-600 transition-colors mt-0.5">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isOutOfStock
                  ? 'bg-red-100 text-red-700'
                  : isLowStock
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-emerald-100 text-emerald-700'
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
        <span className="text-xs sm:text-sm font-bold text-blue-600 tracking-tight">
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
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 active:scale-90 shadow-xs'
            }`}
            title="Adicionar ao carrinho"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
        )}
      </div>
    </div>
  );
};
