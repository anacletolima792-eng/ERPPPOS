import React, { useState } from 'react';
import {
  Users,
  Tag,
  ShieldCheck,
  Building2,
  Database,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  Save,
  Phone,
  Mail,
  MapPin,
  Lock,
  QrCode,
  Layers,
  ChevronRight,
  AlertTriangle,
  X,
  AlertCircle,
} from 'lucide-react';
import { Customer, Category, UserProfile, StoreSettings } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/formatters';
import { safeStorage } from '../utils/storage';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  clearAllDatabaseData,
  seedInitialDemoData,
  subscribeStoreSettings,
  saveStoreSettings,
  deleteCustomer,
  deleteCategory,
  deleteUserProfile,
} from '../services/firestoreService';

interface MorePageProps {
  customers: Customer[];
  categories: Category[];
  users: UserProfile[];
}

type MoreSection = 'customers' | 'categories' | 'users' | 'company' | 'database';

export const MorePage: React.FC<MorePageProps> = ({ customers, categories, users }) => {
  const { currentUser, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<MoreSection>('customers');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Database actions state
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const [clearProducts, setClearProducts] = useState(true);
  const [clearSales, setClearSales] = useState(true);
  const [clearCustomers, setClearCustomers] = useState(true);
  const [clearCategories, setClearCategories] = useState(true);
  const [deletedSummary, setDeletedSummary] = useState<{ products: number; sales: number; customers: number; categories: number } | null>(null);

  // Company settings state (persisted to localStorage & Firestore)
  const [initialSettings, setInitialSettings] = useState<StoreSettings | null>(null);
  const [companyName, setCompanyName] = useState(() => safeStorage.getItem('pdv_company_name') || 'Meu Estabelecimento');
  const [companyCnpj, setCompanyCnpj] = useState(() => safeStorage.getItem('pdv_company_cnpj') || '');
  const [companyPhone, setCompanyPhone] = useState(() => safeStorage.getItem('pdv_company_phone') || '');
  const [companyAddress, setCompanyAddress] = useState(() => safeStorage.getItem('pdv_company_address') || '');
  const [companyPixKey, setCompanyPixKey] = useState(() => safeStorage.getItem('pdv_company_pix') || '');
  const [companyReceiptMsg, setCompanyReceiptMsg] = useState(() => safeStorage.getItem('pdv_company_msg') || 'Obrigado pela preferência! Volte sempre.');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavedCompany, setIsSavedCompany] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setIsDeletingCustomer(true);
      await deleteCustomer(customerToDelete.id);
      showToast(`Cliente "${customerToDelete.name}" excluído com sucesso.`);
      setCustomerToDelete(null);
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      showToast(err.message || 'Falha ao excluir cliente.');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeletingCategory(true);
      await deleteCategory(categoryToDelete.id);
      showToast(`Categoria "${categoryToDelete.name}" excluída com sucesso.`);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Erro ao excluir categoria:', err);
      showToast(err.message || 'Falha ao excluir categoria.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      await deleteUserProfile(userToDelete.id);
      showToast(`Operador "${userToDelete.name}" excluído com sucesso.`);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Erro ao excluir operador:', err);
      showToast(err.message || 'Falha ao excluir operador.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  React.useEffect(() => {
    const unsub = subscribeStoreSettings((settings) => {
      if (settings) {
        setInitialSettings(settings);
        if (settings.storeName) setCompanyName(settings.storeName);
        if (settings.cnpj) setCompanyCnpj(settings.cnpj);
        if (settings.phone) setCompanyPhone(settings.phone);
        if (settings.address) setCompanyAddress(settings.address);
        if (settings.pixKey) setCompanyPixKey(settings.pixKey);
        if (settings.receiptFooter) setCompanyReceiptMsg(settings.receiptFooter);
      }
    });
    return () => unsub();
  }, []);

  const handleCancelCompany = () => {
    if (initialSettings) {
      setCompanyName(initialSettings.storeName || '');
      setCompanyCnpj(initialSettings.cnpj || '');
      setCompanyPhone(initialSettings.phone || '');
      setCompanyAddress(initialSettings.address || '');
      setCompanyPixKey(initialSettings.pixKey || '');
      setCompanyReceiptMsg(initialSettings.receiptFooter || '');
    } else {
      setCompanyName(safeStorage.getItem('pdv_company_name') || 'Meu Estabelecimento');
      setCompanyCnpj(safeStorage.getItem('pdv_company_cnpj') || '');
      setCompanyPhone(safeStorage.getItem('pdv_company_phone') || '');
      setCompanyAddress(safeStorage.getItem('pdv_company_address') || '');
      setCompanyPixKey(safeStorage.getItem('pdv_company_pix') || '');
      setCompanyReceiptMsg(safeStorage.getItem('pdv_company_msg') || 'Obrigado pela preferência! Volte sempre.');
    }
    showToast('Alterações da loja canceladas/revertidas.');
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);

    safeStorage.setItem('pdv_company_name', companyName);
    safeStorage.setItem('pdv_company_cnpj', companyCnpj);
    safeStorage.setItem('pdv_company_phone', companyPhone);
    safeStorage.setItem('pdv_company_address', companyAddress);
    safeStorage.setItem('pdv_company_pix', companyPixKey);
    safeStorage.setItem('pdv_company_msg', companyReceiptMsg);

    try {
      await Promise.race([
        saveStoreSettings({
          storeName: companyName,
          cnpj: companyCnpj,
          phone: companyPhone,
          address: companyAddress,
          pixKey: companyPixKey,
          pixKeyType: 'random',
          receiptFooter: companyReceiptMsg,
        }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      setInitialSettings({
        storeName: companyName,
        cnpj: companyCnpj,
        phone: companyPhone,
        address: companyAddress,
        pixKey: companyPixKey,
        pixKeyType: 'random',
        receiptFooter: companyReceiptMsg,
      });
      showToast('Dados da empresa salvos com sucesso!');
      setIsSavedCompany(true);
      setTimeout(() => setIsSavedCompany(false), 3000);
    } catch (err) {
      console.warn('Aviso ao salvar no Firestore, salvo localmente:', err);
      showToast('Dados da empresa salvos localmente!');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      const result = await clearAllDatabaseData({
        includeProducts: clearProducts,
        includeSales: clearSales,
        includeCustomers: clearCustomers,
        includeCategories: clearCategories,
      });
      setDeletedSummary(result.deletedCounts);
      setIsConfirmClearModalOpen(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 5000);
    } catch (err) {
      console.error('Erro ao limpar banco de dados:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col pb-24 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão & Configurações</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clientes, categorias, operadores e dados da loja</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.name}</span>
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                {currentUser.role}
              </span>
            </div>

            <div className="shrink-0">
              <ThemeToggle id="more-theme-toggle" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
        {/* Navigation Tabs - Responsive Grid for full visibility */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 text-xs font-bold">
            <button
              type="button"
              id="tab-more-customers"
              onClick={() => setActiveSection('customers')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Clientes</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeSection === 'customers'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {customers.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-more-categories"
              onClick={() => setActiveSection('categories')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'categories'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span className="truncate">Categorias</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeSection === 'categories'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {categories.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-more-users"
              onClick={() => setActiveSection('users')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'users'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Operadores</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeSection === 'users'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {users.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-more-company"
              onClick={() => setActiveSection('company')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'company'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Dados da Loja</span>
            </button>

            <button
              type="button"
              id="tab-more-database"
              onClick={() => setActiveSection('database')}
              className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'database'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="truncate">Banco de Dados</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: CUSTOMERS */}
        {activeSection === 'customers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Clientes Cadastrados</h2>
                <p className="text-xs text-slate-500">Histórico de compras e controle de crediário</p>
              </div>
              <button
                type="button"
                id="btn-add-customer-more"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{c.name}</h3>
                        <p className="text-xs text-slate-500">{c.document || 'Sem documento informado'}</p>
                      </div>
                      {c.id !== 'cust-balcao' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            id={`btn-edit-cust-${c.id}`}
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-100"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-cust-${c.id}`}
                            onClick={() => setCustomerToDelete(c)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                            title="Excluir Cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Limite de Crédito:</span>
                    <span className="font-black text-slate-900">{formatCurrency(c.creditLimit || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: CATEGORIES */}
        {activeSection === 'categories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Categorias de Produtos</h2>
                <p className="text-xs text-slate-500">Agrupamento para filtros rápidos no PDV</p>
              </div>
              <button
                type="button"
                id="btn-add-category-more"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Categoria</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color || '#2563eb' }}
                    />
                    <span className="font-extrabold text-slate-900 text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      id={`btn-edit-cat-${cat.id}`}
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-100"
                      title="Editar Categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id={`btn-delete-cat-${cat.id}`}
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: USERS & OPERATORS */}
        {activeSection === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Operadores & Acesso</h2>
                <p className="text-xs text-slate-500">Controle de papéis (Admin vs Vendedor) e PINs</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  id="btn-add-user-more"
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Operador</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
                      isCurrent ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center text-sm ${
                          u.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              u.role === 'admin'
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrador' : 'Vendedor (PDV)'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">PIN: ••••</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id={`btn-edit-user-${u.id}`}
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer shadow-2xs"
                          title="Editar Operador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== 'user-admin-carlos' && (
                          <button
                            type="button"
                            id={`btn-delete-user-${u.id}`}
                            onClick={() => setUserToDelete(u)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer shadow-2xs"
                            title="Excluir Operador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: COMPANY SETTINGS */}
        {activeSection === 'company' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
            <h2 className="font-extrabold text-slate-900 text-base mb-1">Dados da Empresa & Cupom Fiscal</h2>
            <p className="text-xs text-slate-500 mb-4">Informações impressas no recibo térmico e chave PIX padrão</p>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome Fantasia da Loja</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={companyCnpj}
                    onChange={(e) => setCompanyCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Endereço da Loja</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chave PIX da Empresa</label>
                  <input
                    type="text"
                    value={companyPixKey}
                    onChange={(e) => setCompanyPixKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mensagem de Rodapé do Cupom</label>
                  <input
                    type="text"
                    value={companyReceiptMsg}
                    onChange={(e) => setCompanyReceiptMsg(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {isSavedCompany ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Dados salvos com sucesso!
                  </span>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-cancel-company-settings"
                    onClick={handleCancelCompany}
                    disabled={isSavingCompany}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 cursor-pointer transition-colors"
                  >
                    Cancelar / Restaurar
                  </button>
                  <button
                    type="submit"
                    id="btn-save-company-settings"
                    disabled={isSavingCompany}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingCompany ? 'Salvando...' : 'Salvar Dados'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 5: DATABASE & CLEANUP */}
        {activeSection === 'database' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Banco de Dados Firestore</h2>
              <p className="text-xs text-slate-500">Conexão em tempo real e gerenciamento da base de dados</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">Conexão Firestore Ativa</h4>
                <p className="text-[11px] text-emerald-800">
                  Todas as vendas, itens de estoque, clientes e operadores sincronizam em tempo real na nuvem.
                </p>
              </div>
            </div>

            {/* Clear Database Card */}
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-red-950 text-xs sm:text-sm">
                    Limpar Base de Dados (Zerar Sistema)
                  </h4>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    Exclua todos os dados de produtos, vendas realizadas, clientes e categorias do banco de dados para começar a cadastrar os dados reais da sua empresa com uma base 100% limpa.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200/60 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  id="btn-clear-all-data-more"
                  onClick={() => setIsConfirmClearModalOpen(true)}
                  disabled={isClearing}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Todos os Dados salvos na base de dados</span>
                </button>
              </div>

              {clearSuccess && deletedSummary && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Base de dados limpa com sucesso! Removidos: {deletedSummary.products} produtos,{' '}
                    {deletedSummary.sales} vendas, {deletedSummary.customers} clientes e{' '}
                    {deletedSummary.categories} categorias.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal to Clear Database */}
      {isConfirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Limpar Base de Dados?</h3>
                  <p className="text-xs text-red-700 font-medium">Esta ação não poderá ser desfeita</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <p className="leading-relaxed">
                Você está prestes a excluir permanentemente os registros da base de dados Firestore. Selecione o que deseja limpar:
              </p>

              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={clearProducts}
                    onChange={(e) => setClearProducts(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span>Todos os Produtos e Estoque</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={clearSales}
                    onChange={(e) => setClearSales(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span>Todo o Histórico de Vendas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={clearCustomers}
                    onChange={(e) => setClearCustomers(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span>Todos os Clientes Cadastrados</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={clearCategories}
                    onChange={(e) => setClearCategories(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span>Todas as Categorias</span>
                </label>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  Os operadores/usuários de acesso ao sistema não serão excluídos para que você não perca o acesso.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                disabled={isClearing}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={handleClearAllData}
                disabled={isClearing || (!clearProducts && !clearSales && !clearCustomers && !clearCategories)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Limpando Base...' : 'Sim, Limpar Selecionados'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={editingCustomer}
        onSuccess={() => {
          showToast(editingCustomer ? 'Cliente atualizado com sucesso!' : 'Novo cliente cadastrado com sucesso!');
        }}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryToEdit={editingCategory}
        onSuccess={() => {
          showToast(editingCategory ? 'Categoria atualizada com sucesso!' : 'Nova categoria criada com sucesso!');
        }}
      />

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={editingUser}
        onSuccess={() => {
          showToast(editingUser ? 'Operador atualizado com sucesso!' : 'Novo operador cadastrado com sucesso!');
        }}
      />

      {/* Confirmation Modal: Delete Customer */}
      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        title="Excluir Cliente"
        message="Tem certeza de que deseja remover permanentemente este cliente do cadastro?"
        itemName={customerToDelete?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeletingCustomer}
        onConfirm={handleConfirmDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />

      {/* Confirmation Modal: Delete Category */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Excluir Categoria"
        message="Tem certeza de que deseja remover permanentemente esta categoria de produtos?"
        itemName={categoryToDelete?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeletingCategory}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />

      {/* Confirmation Modal: Delete Operator */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Excluir Operador"
        message="Tem certeza de que deseja remover permanentemente o acesso deste operador?"
        itemName={userToDelete?.name}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => setUserToDelete(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
