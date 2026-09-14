import React from 'react';
import { Users, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

interface HeaderProps {
  onOpenOperatorModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenCheckout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenOperatorModal,
  onOpenCustomerModal,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { customer } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Operator Selector */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            id="btn-operator-switch"
            onClick={onOpenOperatorModal}
            className="w-full flex items-center justify-between gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer transition-all text-left group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[11px] text-white font-black shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block group-hover:text-blue-600 transition-colors">
                  {currentUser.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span className="hidden sm:inline">Admin</span>
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  PDV
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </button>
        </div>

        {/* Customer Selector */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            id="btn-customer-select"
            onClick={onOpenCustomerModal}
            className="w-full flex items-center justify-between gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer transition-all text-left group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block group-hover:text-blue-600 transition-colors">
                  {customer?.name || 'Consumidor Final'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {customer?.document ? (
                <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                  {customer.document}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
                  Padrão
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
