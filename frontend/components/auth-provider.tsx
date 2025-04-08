"use client"

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authApi } from '@/lib/api-client';
import { setCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const authCheckAttempted = useRef(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      // Only attempt auth check once
      if (authCheckAttempted.current) return;
      authCheckAttempted.current = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        deleteCookie('token'); // Also delete the cookie
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { access_token } = await authApi.login({ username: email, password });
      
      // Set token in localStorage
      localStorage.setItem('token', access_token);
      
      // Also set token in cookie for middleware
      setCookie('token', access_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
      
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      deleteCookie('token'); // Also delete the cookie
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await authApi.register({ email, password, full_name: name });
      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

