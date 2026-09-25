import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Save, Trash2, AlertCircle, KeyRound, User } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { saveUserProfile, updateUserProfile, deleteUserProfile } from '../services/firestoreService';
import { ConfirmModal } from './ConfirmModal';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserProfile | null;
  onSuccess?: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [pin, setPin] = useState('0000');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPin(userToEdit.pin || '0000');
    } else {
      setName('');
      setEmail('');
      setRole('vendedor');
      setPin('0000');
    }
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (userToEdit) {
        await Promise.race([
          updateUserProfile(userToEdit.id, {
            name: name.trim(),
            email: email.trim(),
            role,
            pin: pin.trim() || '0000',
          }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } else {
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          role,
          pin: pin.trim() || '0000',
          active: true,
          createdAt: new Date().toISOString(),
        };
        await Promise.race([
          saveUserProfile(newUser),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar operador:', err);
      setError(err.message || 'Falha ao salvar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!userToEdit) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToEdit) return;
    try {
      setIsDeleting(true);
      await deleteUserProfile(userToEdit.id);
      setIsConfirmDeleteOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir operador:', err);
      setError(err.message || 'Falha ao remover usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                {userToEdit ? 'Editar Operador' : 'Novo Operador'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Controle de acesso e papéis</p>
            </div>
          </div>
          <button
            id="btn-close-user-form"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome do Operador *</label>
            <input
              type="text"
              required
              id="input-user-name-form"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Silva, Ana Beatriz..."
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail do Usuário *</label>
            <input
              type="email"
              required
              id="input-user-email-form"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@empresa.com"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Papel / Perfil *</label>
              <select
                id="select-user-role-form"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none text-slate-900 dark:text-slate-100"
              >
                <option value="vendedor">Vendedor (PDV)</option>
                <option value="admin">Administrador (Total)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">PIN de Acesso (4 Dígitos)</label>
              <input
                type="text"
                maxLength={6}
                id="input-user-pin-form"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            {userToEdit && userToEdit.id !== 'user-admin-carlos' ? (
              <button
                type="button"
                id="btn-delete-user-form"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cancel-user-form"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-user-form"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Operador'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Excluir Operador"
        message="Tem certeza de que deseja excluir o acesso deste operador?"
        itemName={userToEdit?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
