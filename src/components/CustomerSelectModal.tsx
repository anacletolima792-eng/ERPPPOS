import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Users, Phone, MapPin } from 'lucide-react';
import { Customer } from '../types';
import { useCart } from '../hooks/useCart';
import { subscribeCustomers, createCustomer } from '../services/firestoreService';
import { formatDocument, formatPhone } from '../utils/formatters';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({ isOpen, onClose }) => {
  const { customer: activeCustomer, setCustomer } = useCart();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // New customer form state
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeCustomers(setCustomers);
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.document && c.document.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const handleSelectCustomer = (c: Customer) => {
    setCustomer(c);
    onClose();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      const newCust: Omit<Customer, 'id'> = {
        name: name.trim(),
        document: document.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      };
      const id = await createCustomer(newCust);
      setCustomer({ id, ...newCust });
      setShowNewCustomerForm(false);
      setName('');
      setDocument('');
      setPhone('');
      setEmail('');
      setAddress('');
      onClose();
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Identificar Cliente</h2>
              <p className="text-xs text-slate-500 font-medium">Vincule a venda a um cliente</p>
            </div>
          </div>
          <button
            id="btn-close-customer-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {showNewCustomerForm ? (
            <form onSubmit={handleCreateCustomer} className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-slate-700">Novo Cliente Rápido</h3>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  id="input-new-cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    id="input-new-cust-doc"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    id="input-new-cust-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Endereço</label>
                <input
                  type="text"
                  id="input-new-cust-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                id="btn-save-new-customer"
                disabled={isSaving}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                {isSaving ? 'Salvando...' : 'Salvar e Selecionar Cliente'}
              </button>
            </form>
          ) : (
            <>
              {/* Search & Add button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="input-search-customer"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, CPF/CNPJ ou tel..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="button"
                  id="btn-show-new-customer-form"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Novo</span>
                </button>
              </div>

              {/* Customer List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pt-1">
                {/* Default Balcao option */}
                <button
                  type="button"
                  id="btn-cust-balcao"
                  onClick={() =>
                    handleSelectCustomer({
                      id: 'cust-balcao',
                      name: 'Consumidor Final (Balcão)',
                      notes: 'Venda de balcão',
                    })
                  }
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all text-left ${
                    activeCustomer?.id === 'cust-balcao'
                      ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      CF
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">
                        Consumidor Final (Balcão)
                      </span>
                      <span className="text-[11px] text-slate-500">Sem cadastro / Venda rápida</span>
                    </div>
                  </div>
                  {activeCustomer?.id === 'cust-balcao' && (
                    <Check className="w-4 h-4 text-orange-600 font-bold" />
                  )}
                </button>

                {filteredCustomers
                  .filter((c) => c.id !== 'cust-balcao')
                  .map((cust) => {
                    const isSelected = activeCustomer?.id === cust.id;
                    return (
                      <button
                        key={cust.id}
                        type="button"
                        id={`btn-cust-${cust.id}`}
                        onClick={() => handleSelectCustomer(cust)}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all text-left ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/40'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-sm text-slate-900 truncate block">
                              {cust.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              {cust.document && <span>{formatDocument(cust.document)}</span>}
                              {cust.phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  {formatPhone(cust.phone)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-600 font-bold ml-2" />}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
