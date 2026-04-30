import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_TECHNICIAN';

export interface AuthUser {
  username: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
  canWrite: boolean;
  canDelete: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'pml_auth_token';
const USER_KEY  = 'pml_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await axios.post<{
      token: string; username: string; email: string; role: UserRole; expiresIn: number;
    }>('/api/auth/login', { username, password });

    const { token, role, email } = response.data;
    const authUser: AuthUser = { username: response.data.username, email, role, token };

    setUser(authUser);
    localStorage.setItem(USER_KEY,  JSON.stringify(authUser));
    localStorage.setItem(TOKEN_KEY, token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success('Logged out successfully');
  };

  const isAdmin      = user?.role === 'ROLE_ADMIN';
  const isManager    = user?.role === 'ROLE_MANAGER';
  const isTechnician = user?.role === 'ROLE_TECHNICIAN';
  const canWrite     = isAdmin || isManager;
  const canDelete    = isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin, isManager, isTechnician, canWrite, canDelete,
      login, logout, loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
