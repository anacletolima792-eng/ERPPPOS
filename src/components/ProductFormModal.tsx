import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Save,
  Trash2,
  AlertCircle,
  Barcode,
  ScanLine,
  Sparkles,
  Check,
} from 'lucide-react';
import { Product, Category } from '../types';
import { createProduct, updateProduct, deleteProduct } from '../services/firestoreService';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';
import { QuantityStepper } from './QuantityStepper';
import { parseCurrencyToNumber } from '../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  onSuccess?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('UN');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCode(productToEdit.code);
      setBarcode(productToEdit.barcode || '');
      setCategoryId(productToEdit.categoryId || '');
      setPrice(productToEdit.price);
      setCostPrice(productToEdit.costPrice || 0);
      setStock(productToEdit.stock.toString());
      setMinStock(productToEdit.minStock?.toString() || '5');
      setUnit(productToEdit.unit || 'UN');
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      setName('');
      setCode(`#${Math.floor(10000 + Math.random() * 90000)}`);
      setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setCategoryId(categories[0]?.id || '');
      setPrice(0);
      setCostPrice(0);
      setStock('10');
      setMinStock('5');
      setUnit('UN');
      setImageUrl('');
    }
    setError(null);
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do produto é obrigatório.');
      return;
    }

    const priceNum = typeof price === 'number' ? price : parseCurrencyToNumber(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Informe um preço de venda válido maior que zero (Ex: R$ 19,90).');
      return;
    }

    const costNum = typeof costPrice === 'number' ? costPrice : parseCurrencyToNumber(costPrice);

    const cleanStockStr = stock.toString().replace(',', '.').trim();
    const stockNum = cleanStockStr ? parseFloat(cleanStockStr) || 0 : 0;

    const cleanMinStockStr = minStock.toString().replace(',', '.').trim();
    const minStockNum = cleanMinStockStr ? parseFloat(cleanMinStockStr) || 5 : 5;

    const selectedCategory = categories.find((c) => c.id === categoryId);

    try {
      setIsSaving(true);
      setError(null);

      const productPayload = {
        name: name.trim().toUpperCase(),
        code: code.trim() || `#${Math.floor(10000 + Math.random() * 90000)}`,
        barcode: barcode.trim() || '',
        categoryId: categoryId || '',
        categoryName: selectedCategory?.name || '',
        price: priceNum,
        costPrice: costNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: unit.trim().toUpperCase() || 'UN',
        imageUrl: imageUrl.trim() || '',
      };

      if (productToEdit) {
        await Promise.race([
          updateProduct(productToEdit.id, productPayload),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } else {
        await Promise.race([
          createProduct(productPayload),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      setError(err.message || 'Falha ao salvar produto no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!productToEdit) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToEdit) return;
    try {
      setIsDeleting(true);
      await deleteProduct(productToEdit.id);
      setIsConfirmDeleteOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir produto:', err);
      setError(err.message || 'Falha ao excluir produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {productToEdit ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Controle de estoque e precificação</p>
            </div>
          </div>
          <button
            id="btn-close-product-form"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Código do Item *</label>
              <input
                type="text"
                required
                id="input-prod-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="#00018"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Unidade (UN, KG, CX...)</label>
              <select
                id="select-prod-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="UN">UN (Unidade)</option>
                <option value="KG">KG (Quilo)</option>
                <option value="CX">CX (Caixa)</option>
                <option value="MT">MT (Metro)</option>
                <option value="LT">LT (Litro)</option>
                <option value="GL">GL (Galão)</option>
                <option value="SC">SC (Saco)</option>
                <option value="PCT">PCT (Pacote)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              id="input-prod-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: LÁPIS PED IRWIN, CIMENTO CP-II..."
              className="w-full px-3.5 py-2.5 text-xs font-semibold uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Preço de Venda *</label>
              <CurrencyInput
                id="input-prod-price"
                value={price}
                onChange={(val) => setPrice(val)}
                required
                className="w-full py-2 text-sm font-black text-blue-950 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Preço de Custo</label>
              <CurrencyInput
                id="input-prod-cost"
                value={costPrice}
                onChange={(val) => setCostPrice(val)}
                className="w-full py-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Real-time Profit Difference & Profit Margin Display */}
          {(() => {
            const saleNum = typeof price === 'number' ? price : parseCurrencyToNumber(price);
            const costNum = typeof costPrice === 'number' ? costPrice : parseCurrencyToNumber(costPrice);
            const diff = saleNum - costNum;
            const margin = saleNum > 0 ? (diff / saleNum) * 100 : 0;
            const markup = costNum > 0 ? (diff / costNum) * 100 : 0;

            const formatBRL = (val: number) =>
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(val);

            if (saleNum === 0 && costNum === 0) return null;

            return (
              <div
                id="box-product-margin-preview"
                className={`p-2.5 rounded-xl border transition-all ${
                  diff > 0
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : diff < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Diferença (Lucro)
                    </span>
                    <strong
                      className={`text-xs sm:text-sm font-black block mt-0.5 ${
                        diff > 0
                          ? 'text-emerald-700'
                          : diff < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {formatBRL(diff)}
                    </strong>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Margem s/ Venda
                    </span>
                    <strong
                      className={`text-xs sm:text-sm font-black block mt-0.5 ${
                        margin > 0
                          ? 'text-emerald-700'
                          : margin < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {margin.toFixed(1)}%
                    </strong>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Markup s/ Custo
                    </span>
                    <strong className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                      {costNum > 0 ? `${markup.toFixed(1)}%` : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Estoque Atual *</label>
              <QuantityStepper
                id="input-prod-stock"
                value={parseInt(stock.toString(), 10) || 0}
                onChange={(val) => setStock(val.toString())}
                min={0}
                size="md"
                className="w-full"
                unit={unit}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Estoque Mínimo</label>
              <QuantityStepper
                id="input-prod-min-stock"
                value={parseInt(minStock.toString(), 10) || 0}
                onChange={(val) => setMinStock(val.toString())}
                min={0}
                size="md"
                className="w-full"
                unit={unit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Categoria</label>
              <select
                id="select-prod-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Código de Barras (EAN)
                </label>
                {scanSuccessFeedback && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" />
                    Lido da Câmera!
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  id="input-prod-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="7891234560020"
                  className={`w-full pl-3 pr-20 py-2 text-xs font-mono font-semibold bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden transition-all ${
                    scanSuccessFeedback
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-orange-500'
                  }`}
                />

                {/* Camera Scanner Trigger Button inside the barcode field */}
                <div className="absolute right-1 flex items-center gap-1">
                  {barcode && (
                    <button
                      type="button"
                      onClick={() => setBarcode('')}
                      title="Limpar código de barras"
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    id="btn-scan-barcode-camera"
                    onClick={() => setIsCameraScannerOpen(true)}
                    title="Usar câmera do celular para escanear código de barras"
                    className="px-2 py-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Ler</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Toque no botão para ler o código direto da embalagem
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL da Imagem (Opcional)</label>
            <input
              type="url"
              id="input-prod-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            {productToEdit ? (
              <button
                type="button"
                id="btn-delete-product"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cancel-product-form"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-product"
                disabled={isSaving}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Produto'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(scanned) => {
          setBarcode(scanned);
          setScanSuccessFeedback(true);
          setTimeout(() => setScanSuccessFeedback(false), 3000);
        }}
        title="Escanear Código de Barras do Produto"
        subtitle="Aponte a câmera para o código de barras ou EAN impresso na embalagem"
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Excluir Produto"
        message="Tem certeza de que deseja remover permanentemente este produto do sistema?"
        itemName={productToEdit ? `${productToEdit.name} (${productToEdit.code})` : undefined}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
