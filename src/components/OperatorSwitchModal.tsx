import React, { useState } from 'react';
import { X, Lock, ShieldCheck, UserCheck, KeyRound, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';

interface OperatorSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserManagement?: () => void;
}

export const OperatorSwitchModal: React.FC<OperatorSwitchModalProps> = ({
  isOpen,
  onClose,
  onOpenUserManagement,
}) => {
  const { currentUser, availableUsers, switchUser, isAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetUser = availableUsers.find((u) => u.id === selectedUserId) || currentUser;

  const handleSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = await switchUser(selectedUserId, pin);
    if (success) {
      setPin('');
      onClose();
    } else {
      setError('PIN / Senha incorreta. Tente novamente.');
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    setError(null);
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Trocar Operador / Caixa</h2>
              <p className="text-xs text-slate-500 font-medium">Selecione o usuário autenticado</p>
            </div>
          </div>
          <button
            id="btn-close-operator-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* User selector list */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Selecione o Operador
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableUsers.map((user) => {
                const isSelected = user.id === selectedUserId;
                const isCurrent = user.id === currentUser.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    id={`btn-select-user-${user.id}`}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/40'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{user.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              Atual
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          Papel: {user.role} {user.role === 'admin' ? '🛡️' : '💼'}
                        </span>
                      </div>
                    </div>

                    {isSelected && <UserCheck className="w-5 h-5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input form */}
          <form onSubmit={handleSwitch} className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  PIN de Acesso para {targetUser.name}
                </label>
                <span className="text-[11px] text-slate-400">
                  (Dica: Carlos: 1234, Ana: 0000)
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  id="input-operator-pin"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite o PIN de 4 dígitos"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-confirm-operator-switch"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Confirmar e Acessar Caixa
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
