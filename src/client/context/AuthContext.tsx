import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import config from "../config";
import type { User } from "../types/index";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  loginGuest: () => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  recover: (
    email: string,
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (
    data: Partial<User>,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = api.getToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getAccount();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        // Invalid or expired token
        api.setToken(null);
        setToken(null);
        setUser(null);
      }
    } catch {
      api.setToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(password);
      if (res.success && res.token) {
        api.setToken(res.token);
        setToken(res.token);
        if (res.user) {
          setUser(res.user);
        } else {
          await refreshUser();
        }
        return { success: true };
      }
      return {
        success: false,
        error: res.error || "Invalid password or credentials",
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const loginGuest = async () => {
    return login(config.guest?.text || "");
  };

  const register = async (email: string) => {
    try {
      const res = await api.register(email);
      if (res.success) {
        return {
          success: true,
          message:
            res.message || "Registration email sent. Please check your inbox.",
        };
      }
      return { success: false, error: res.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Registration failed" };
    }
  };

  const recover = async (email: string) => {
    try {
      const res = await api.recover(email);
      if (res.success) {
        return {
          success: true,
          message:
            res.message || "Password recovery instructions sent to your email.",
        };
      }
      return {
        success: false,
        error: res.error || "Password recovery request failed",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Password recovery request failed",
      };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.updateAccount(data);
      if (res.success) {
        if (res.data) setUser(res.data);
        return { success: true };
      }
      return { success: false, error: res.error || "Failed to update profile" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Profile update error" };
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = !!user?.admin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        loginGuest,
        register,
        recover,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
