/**
 * AuthContext — Real JWT authentication for MindSaathi
 * Handles login, logout, token persistence & refresh, and current user state.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, getAccessToken, clearTokens } from "../services/api";

export type UserRole = "student" | "counselor" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role: UserRole;
  is_active?: boolean;
  is_verified?: boolean;
  institution_id?: string | null;
  institution_name?: string | null;
  institution_code?: string | null;
  department?: string;
  year_of_study?: number;
  anonymous_id?: string;
  employee_id?: string;
  verification_status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("mindsaathi_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // On mount, validate the stored token by fetching /auth/me
  useEffect(() => {
    const token = getAccessToken();
    if (token && !user) {
      setIsLoading(true);
      authApi.getMe()
        .then((data) => {
          const u = data.data ?? data;
          setUser(u);
          localStorage.setItem("mindsaathi_user", JSON.stringify(u));
        })
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password, role);
      const u: AuthUser = res.user ?? res;
      setUser(u);
      localStorage.setItem("mindsaathi_user", JSON.stringify(u));
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Always clear local state even if server call fails
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      const u = data.data ?? data;
      setUser(u);
      localStorage.setItem("mindsaathi_user", JSON.stringify(u));
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
