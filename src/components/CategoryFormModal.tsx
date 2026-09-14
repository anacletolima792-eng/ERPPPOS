import React, { useState, useEffect } from 'react';
import { X, Tag, Save, Trash2, AlertCircle } from 'lucide-react';
import { Category } from '../types';
import { createCategory, updateCategory, deleteCategory } from '../services/firestoreService';
import { ConfirmModal } from './ConfirmModal';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  onSuccess?: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setColor(categoryToEdit.color || '#f97316');
    } else {
      setName('');
      setColor('#f97316');
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (categoryToEdit) {
        await Promise.race([
          updateCategory(categoryToEdit.id, { name: name.trim(), color }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } else {
        await Promise.race([
          createCategory({ name: name.trim(), color }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err);
      setError(err.message || 'Falha ao salvar categoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!categoryToEdit) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToEdit) return;
    try {
      setIsDeleting(true);
      await deleteCategory(categoryToEdit.id);
      setIsConfirmDeleteOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir categoria:', err);
      setError(err.message || 'Falha ao excluir categoria.');
    } finally {
      setIsDeleting(false);
    }
  };

  const colors = ['#f97316', '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444', '#eab308', '#ec4899', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Organização de produtos no PDV</p>
            </div>
          </div>
          <button
            id="btn-close-category-form"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              id="input-cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ferramentas, Elétrica, Tintas..."
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Cor de Identificação</label>
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200">
            {categoryToEdit ? (
              <button
                type="button"
                id="btn-delete-category"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cancel-category"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-category"
                disabled={isSaving}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Excluir Categoria"
        message="Tem certeza de que deseja excluir permanentemente esta categoria?"
        itemName={categoryToEdit?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
