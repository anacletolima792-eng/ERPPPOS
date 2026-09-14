import React, { useState, useEffect } from 'react';
import { X, Users, Save, Trash2, AlertCircle } from 'lucide-react';
import { Customer } from '../types';
import { createCustomer, updateCustomer, deleteCustomer } from '../services/firestoreService';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSuccess?: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(1000);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setDocument(customerToEdit.document || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setCreditLimit(customerToEdit.creditLimit || 0);
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setDocument('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit(1000);
      setNotes('');
    }
    setError(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const customerPayload: Omit<Customer, 'id'> = {
        name: name.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: creditLimit || 0,
        notes: notes.trim() || undefined,
      };

      if (customerToEdit) {
        await Promise.race([
          updateCustomer(customerToEdit.id, customerPayload),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } else {
        await Promise.race([
          createCustomer(customerPayload),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      setError(err.message || 'Falha ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!customerToEdit) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToEdit) return;
    try {
      setIsDeleting(true);
      await deleteCustomer(customerToEdit.id);
      setIsConfirmDeleteOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      setError(err.message || 'Falha ao excluir cliente.');
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
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Cadastro para vendas a prazo e histórico</p>
            </div>
          </div>
          <button
            id="btn-close-customer-form"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo / Razão Social *</label>
            <input
              type="text"
              required
              id="input-cust-name-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Construtor, Marina Silva..."
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">CPF ou CNPJ</label>
              <input
                type="text"
                id="input-cust-document-full"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                id="input-cust-phone-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">E-mail</label>
              <input
                type="email"
                id="input-cust-email-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Limite de Crédito</label>
              <CurrencyInput
                id="input-cust-limit-full"
                value={creditLimit}
                onChange={(val) => setCreditLimit(val)}
                className="w-full py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Endereço Completo</label>
            <input
              type="text"
              id="input-cust-addr-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Observações Internas</label>
            <textarea
              rows={2}
              id="input-cust-notes-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Paga sempre no dia 10..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200">
            {customerToEdit && customerToEdit.id !== 'cust-balcao' ? (
              <button
                type="button"
                id="btn-delete-customer"
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
                id="btn-cancel-customer"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-customer-full"
                disabled={isSaving}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Cliente'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Excluir Cliente"
        message="Tem certeza de que deseja remover permanentemente este cliente do cadastro?"
        itemName={customerToEdit?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
