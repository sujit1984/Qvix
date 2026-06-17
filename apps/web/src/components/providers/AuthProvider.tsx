'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@qvix/shared';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('qvix_token');
    if (storedToken) {
      setToken(storedToken);
      fetchMe(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchMe(authToken: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data?.data?.user ?? null);
      } else {
        localStorage.removeItem('qvix_token');
        setToken(null);
      }
    } catch {
      localStorage.removeItem('qvix_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    const tokenValue = data?.data?.token;
    const userValue = data?.data?.user;
    if (!tokenValue || !userValue) {
      throw new Error('Invalid login response');
    }
    localStorage.setItem('qvix_token', tokenValue);
    setToken(tokenValue);
    setUser(userValue);
  }

  function logout() {
    localStorage.removeItem('qvix_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
