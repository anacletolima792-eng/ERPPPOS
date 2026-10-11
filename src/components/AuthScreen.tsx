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
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
    />
  </svg>
);

export const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle, loginAsDemo } = useAuth();
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatFirebaseError = (error: any): string => {
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
      return 'Falha na conexão de rede. Verifique sua internet.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'A janela de autenticação Google foi fechada antes de concluir o login.';
    }
    if (code === 'auth/popup-blocked') {
      return 'O navegador bloqueou a janela pop-up do Google. Por favor, permita pop-ups para este site.';
    }
    if (code === 'auth/cancelled-popup-request') {
      return 'Solicitação cancelada. Tente novamente.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return 'Já existe uma conta cadastrada com este e-mail usando outro método.';
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
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(formatFirebaseError(err));
      setIsGoogleSubmitting(false);
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
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginAsDemo();
    } catch (err: any) {
      setErrorMessage(formatFirebaseError(err));
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

        <ThemeToggle id="auth-theme-toggle" />
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
              <div className="space-y-4">
                {/* Google Sign-in Button */}
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSubmitting || isSubmitting}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-98 text-slate-800 dark:text-slate-100 rounded-2xl font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGoogleSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Entrar com a Conta Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                    ou use seu e-mail
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>

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
                    disabled={isSubmitting || isGoogleSubmitting}
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
              </div>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <div className="space-y-4">
                {/* Google Register Button */}
                <button
                  type="button"
                  id="btn-google-register"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSubmitting || isSubmitting}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-98 text-slate-800 dark:text-slate-100 rounded-2xl font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGoogleSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Cadastrar com a Conta Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                    ou preencha os dados
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>

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
                  disabled={isSubmitting || isGoogleSubmitting}
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
            </div>
          )}

            {/* Quick Demo Option */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Deseja testar rapidamente sem preencher formulários?
              </p>
              <button
                type="button"
                id="btn-quick-demo"
                onClick={handleQuickDemo}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Acessar Modo Demonstração (Empresa Nova Limpa)</span>
              </button>
            </div>
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
