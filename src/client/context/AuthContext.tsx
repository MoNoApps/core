import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import type { User } from "../types/index";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isLoading: boolean;
  login: (
    emailOrPassword: string,
    password?: string,
  ) => Promise<{ success: boolean; error?: string }>;
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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("core_user");
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!api.getToken();
    }
    return false;
  });
  const refreshUser = async () => {
    const currentToken = api.getToken();
    if (!currentToken) {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("core_user");
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getAccount();
      if (res.success && res.data) {
        setUser(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("core_user", JSON.stringify(res.data));
        }
      } else {
        // Invalid or expired token
        api.setToken(null);
        setToken(null);
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("core_user");
        }
      }
    } catch {
      api.setToken(null);
      setToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("core_user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("core_user");
          window.location.hash = "#/";
        } catch {}
      }
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const existingToken = api.getToken();
    if (existingToken) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (emailOrPassword: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(emailOrPassword, password);
      if (res.success && res.token) {
        api.setToken(res.token);
        setToken(res.token);
        if (res.user) {
          setUser(res.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("core_user", JSON.stringify(res.user));
          }
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

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.updateAccount(data);
      if (res.success) {
        if (res.data) {
          setUser(res.data);
          if (typeof window !== "undefined") {
            localStorage.setItem("core_user", JSON.stringify(res.data));
          }
        }
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("core_user");
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = !!user?.admin;
  const isViewer = user?.role === "viewer";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isViewer,
        isLoading,
        login,
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

export default AuthContext;
