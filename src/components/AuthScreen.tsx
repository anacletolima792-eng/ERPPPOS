import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatFirebaseError = (error: any): string => {
    console.error('[Firebase Auth Error Details]:', error);
    const code = error?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    }
    if (code === 'auth/user-not-found') {
      return 'Nenhuma conta cadastrada com este e-mail.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
    }
    if (code === 'auth/weak-password') {
      return 'A senha é muito fraca. Digite pelo menos 6 caracteres.';
    }
    if (code === 'auth/invalid-email') {
      return 'Formato de e-mail inválido.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Falha na conexão de rede. Verifique sua conexão com a internet.';
    }
    return error?.message || 'Ocorreu um erro ao processar. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Informe o nome da sua empresa.');
      return;
    }
    if (!adminName.trim()) {
      setErrorMessage('Informe o seu nome (Administrador).');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail de acesso.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(companyName, adminName, email, password);
    } catch (err: any) {
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">PDV & ERP Pro</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wider">
                SaaS Cloud
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sistema Multi-Empresa em Tempo Real</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-1.5 gap-1.5">
            <button
              type="button"
              id="tab-btn-login"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Acessar Conta</span>
            </button>
            <button
              type="button"
              id="tab-btn-register"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Criar Empresa</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header intro per tab */}
            {activeTab === 'login' ? (
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Bem-vindo de volta!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Digite seu e-mail e senha para acessar o painel da sua empresa.
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Cadastrar Nova Empresa
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sua empresa começará com banco de dados <strong className="text-blue-600 dark:text-blue-400">100% limpo e zerado</strong> para iniciar do zero.
                </p>

                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                    Ambiente isolado SaaS: 0 produtos, 0 vendas e 0 orçamentos cadastrados. Pronto para sua empresa!
                  </p>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="input-login-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    Nome da Empresa / Loja
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-register-company"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Mercadinho Central, Loja VIP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    Seu Nome (Administrador)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-register-admin"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    E-mail Corporativo / Pessoal
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="input-register-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-register-password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mín. 6 dígitos"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                      />
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      Confirmar
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-register-confirm"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                      />
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mostrar senhas</span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="btn-submit-register"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Criar Empresa & Começar do Zero</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-md mx-auto px-4 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>PDV & ERP Pro SaaS &bull; Dados protegidos e isolados por empresa</span>
        </div>
      </footer>
    </div>
  );
};
