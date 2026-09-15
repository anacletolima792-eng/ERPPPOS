import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { subscribeUsers, saveUserProfile, DEFAULT_USERS } from '../services/firestoreService';
import { safeStorage } from '../utils/storage';

interface AuthContextType {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  isAdmin: boolean;
  isSeller: boolean;
  switchUser: (userId: string, pin?: string) => Promise<boolean>;
  addUser: (name: string, email: string, role: UserRole, pin?: string) => Promise<UserProfile>;
  logout: () => void;
  loading: boolean;
}

const DEFAULT_ADMIN: UserProfile = {
  id: 'user-admin',
  name: 'Administrador',
  email: 'admin@sistema.com',
  role: 'admin',
  active: true,
  pin: '1234',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = safeStorage.getItem('pdv_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return DEFAULT_ADMIN;
  });

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeUsers((users) => {
      if (users.length > 0) {
        setAvailableUsers(users);
        // If current user is still in the list, update it
        const currentStillExists = users.find(u => u.id === currentUser.id);
        if (currentStillExists) {
          setCurrentUser(currentStillExists);
          localStorage.setItem('pdv_current_user', JSON.stringify(currentStillExists));
        } else if (users.length > 0) {
          setCurrentUser(users[0]);
          localStorage.setItem('pdv_current_user', JSON.stringify(users[0]));
        }
      } else {
        // Ensure default users are in Firestore
        DEFAULT_USERS.forEach((u) => saveUserProfile(u));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const switchUser = async (userId: string, enteredPin?: string): Promise<boolean> => {
    const targetUser = availableUsers.find(u => u.id === userId);
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

  const logout = () => {
    // Reset to default or lock
    if (availableUsers.length > 0) {
      const defaultUser = availableUsers[0];
      setCurrentUser(defaultUser);
      safeStorage.setItem('pdv_current_user', JSON.stringify(defaultUser));
    }
  };

  const isAdmin = currentUser.role === 'admin';
  const isSeller = currentUser.role === 'vendedor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        isAdmin,
        isSeller,
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
