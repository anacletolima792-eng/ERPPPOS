import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  setTenantId,
  getTenantId,
  subscribeUsers,
  saveUserProfile,
  saveStoreSettings,
  createCustomer,
  getStoreSettings,
} from '../services/firestoreService';
import { safeStorage } from '../utils/storage';

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  companyId: string | null;
  companyName: string;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  isAdmin: boolean;
  isSeller: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (companyName: string, adminName: string, email: string, password: string) => Promise<void>;
  loginAsDemo: (demoCompanyName?: string) => Promise<void>;
  switchUser: (userId: string, pin?: string) => Promise<boolean>;
  addUser: (name: string, email: string, role: UserRole, pin?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_ADMIN: UserProfile = {
  id: 'user-admin',
  name: 'Administrador',
  email: 'admin@empresa.com',
  role: 'admin',
  active: true,
  pin: '1234',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(() => {
    return safeStorage.getItem('pdv_current_tenant_id') || null;
  });
  const [companyName, setCompanyName] = useState<string>(() => {
    return safeStorage.getItem('pdv_company_name') || 'Minha Empresa';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const demo = safeStorage.getItem('pdv_demo_session');
    const tid = safeStorage.getItem('pdv_current_tenant_id');
    return !!(demo || tid);
  });
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = safeStorage.getItem('pdv_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return DEFAULT_ADMIN;
  });

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([DEFAULT_ADMIN]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        const tid = user.uid;
        setTenantId(tid);
        setCompanyId(tid);
        setIsAuthenticated(true);

        try {
          const settings = await getStoreSettings();
          const name = settings.storeName || user.displayName || 'Minha Empresa';
          setCompanyName(name);
          safeStorage.setItem('pdv_company_name', name);
        } catch {}

        setLoading(false);
      } else {
        // Check if demo session is active
        const demo = safeStorage.getItem('pdv_demo_session');
        if (demo) {
          try {
            const parsed = JSON.parse(demo);
            if (parsed.tenantId) {
              setTenantId(parsed.tenantId);
              setCompanyId(parsed.tenantId);
              setCompanyName(parsed.companyName || 'Empresa Demonstração');
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          } catch {}
        }

        // Not authenticated
        setFirebaseUser(null);
        setCompanyId(null);
        setTenantId('');
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to operators/users of the active company tenant
  useEffect(() => {
    if (!companyId || !isAuthenticated) {
      return;
    }

    const unsubscribeUsers = subscribeUsers((users) => {
      if (users.length > 0) {
        setAvailableUsers(users);
        const currentStillExists = users.find((u) => u.id === currentUser.id);
        if (currentStillExists) {
          setCurrentUser(currentStillExists);
          safeStorage.setItem('pdv_current_user', JSON.stringify(currentStillExists));
        } else {
          setCurrentUser(users[0]);
          safeStorage.setItem('pdv_current_user', JSON.stringify(users[0]));
        }
      } else {
        // First-time company initialization - create the initial admin operator
        const ownerName = firebaseUser?.displayName || 'Administrador';
        const ownerEmail = firebaseUser?.email || 'admin@empresa.com';
        const initialAdmin: UserProfile = {
          id: `user-${companyId}`,
          name: ownerName,
          email: ownerEmail,
          role: 'admin',
          active: true,
          pin: '1234',
          createdAt: new Date().toISOString(),
        };
        saveUserProfile(initialAdmin);
        setAvailableUsers([initialAdmin]);
        setCurrentUser(initialAdmin);
        safeStorage.setItem('pdv_current_user', JSON.stringify(initialAdmin));
      }
    });

    return () => unsubscribeUsers();
  }, [companyId, isAuthenticated, firebaseUser]);

  // Login with existing account
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      safeStorage.removeItem('pdv_demo_session');
      const tid = res.user.uid;
      setTenantId(tid);
      setCompanyId(tid);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  // Register brand new company (clean slate SaaS)
  const register = async (
    newCompanyName: string,
    adminName: string,
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const tid = res.user.uid;
      const cleanCompanyName = newCompanyName.trim() || 'Minha Empresa';
      const cleanAdminName = adminName.trim() || 'Administrador';
      const cleanEmail = email.trim();

      // Update profile
      try {
        await updateProfile(res.user, { displayName: cleanAdminName });
      } catch {}

      // Set active tenant in storage and firestore service
      setTenantId(tid);
      setCompanyId(tid);
      setCompanyName(cleanCompanyName);
      safeStorage.setItem('pdv_company_name', cleanCompanyName);
      safeStorage.removeItem('pdv_demo_session');

      // Initialize company settings in Firestore
      await saveStoreSettings({
        storeName: cleanCompanyName,
        cnpj: '',
        phone: '',
        email: cleanEmail,
        address: '',
        pixKey: '',
        pixKeyType: 'random',
        receiptFooter: 'Obrigado pela preferência! Volte sempre.',
      });

      // Initialize initial admin operator
      const initialAdmin: UserProfile = {
        id: `user-${tid}`,
        name: cleanAdminName,
        email: cleanEmail,
        role: 'admin',
        active: true,
        pin: '1234',
        createdAt: new Date().toISOString(),
      };
      await saveUserProfile(initialAdmin);
      setCurrentUser(initialAdmin);
      setAvailableUsers([initialAdmin]);
      safeStorage.setItem('pdv_current_user', JSON.stringify(initialAdmin));

      // Initialize default customer (Balcão) so POS works smoothly
      await createCustomer({
        name: 'Consumidor Final (Balcão)',
        phone: '',
        email: '',
        document: '',
        notes: 'Cliente padrão para vendas rápidas no balcão',
      });

      // Products, sales, categories, and quotes start 100% EMPTY (0 items)
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  // Quick Demo / Test mode starting with clean company
  const loginAsDemo = async (customCompanyName?: string): Promise<void> => {
    setLoading(true);
    try {
      const demoId = `demo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const name = customCompanyName?.trim() || 'Minha Empresa Demonstração';
      
      setTenantId(demoId);
      setCompanyId(demoId);
      setCompanyName(name);
      
      safeStorage.setItem('pdv_demo_session', JSON.stringify({ tenantId: demoId, companyName: name }));
      safeStorage.setItem('pdv_company_name', name);

      // Initialize demo company
      await saveStoreSettings({
        storeName: name,
        receiptFooter: 'Obrigado pela preferência! Volte sempre.',
      });

      const initialAdmin: UserProfile = {
        id: `user-${demoId}`,
        name: 'Administrador Demo',
        email: 'demo@empresa.com',
        role: 'admin',
        active: true,
        pin: '1234',
        createdAt: new Date().toISOString(),
      };
      await saveUserProfile(initialAdmin);
      setCurrentUser(initialAdmin);
      setAvailableUsers([initialAdmin]);
      safeStorage.setItem('pdv_current_user', JSON.stringify(initialAdmin));

      await createCustomer({
        name: 'Consumidor Final (Balcão)',
        notes: 'Cliente padrão para vendas rápidas no balcão',
      });

      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const switchUser = async (userId: string, enteredPin?: string): Promise<boolean> => {
    const targetUser = availableUsers.find((u) => u.id === userId);
    if (!targetUser) return false;

    if (targetUser.pin && enteredPin !== undefined) {
      if (targetUser.pin !== enteredPin) {
        return false;
      }
    }

    setCurrentUser(targetUser);
    safeStorage.setItem('pdv_current_user', JSON.stringify(targetUser));
    return true;
  };

  const addUser = async (name: string, email: string, role: UserRole, pin?: string): Promise<UserProfile> => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      pin: pin || '0000',
      active: true,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Erro ao sair do Firebase Auth:', e);
    }

    // Clear tenant state and browser cache
    safeStorage.removeItem('pdv_demo_session');
    safeStorage.removeItem('pdv_current_user');
    safeStorage.removeItem('pdv_cart_items');
    safeStorage.removeItem('pdv_current_discount');
    safeStorage.removeItem('pdv_applied_customer_id');

    setTenantId('');
    setCompanyId(null);
    setFirebaseUser(null);
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_ADMIN);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isSeller = currentUser?.role === 'vendedor';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        isAuthenticated,
        companyId,
        companyName,
        currentUser,
        availableUsers,
        isAdmin,
        isSeller,
        login,
        register,
        loginAsDemo,
        switchUser,
        addUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
