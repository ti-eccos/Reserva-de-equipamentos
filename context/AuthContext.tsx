import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, UserRole } from '../types';
import { syncUser } from '../services/db';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      if (!email?.endsWith('@colegioeccos.com.br')) {
        await signOut(auth);
        alert('Acesso restrito para @colegioeccos.com.br');
        return;
      }

      const userProfile = await syncUser(result.user);
      if (userProfile.isBlocked) {
        await signOut(auth);
        alert('Sua conta está bloqueada. Contate o administrador.');
        return;
      }
      setUser(userProfile);
    } catch (error) {
      console.error("Login error", error);
      alert('Erro ao fazer login.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.email?.endsWith('@colegioeccos.com.br')) {
           await signOut(auth);
           setLoading(false);
           return;
        }
        const profile = await syncUser(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
