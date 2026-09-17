"use client";

import * as React from "react";
import { AdminUser, SEEDED_ADMIN_USERS, DEFAULT_USER } from "./auth-data";

interface AuthContextType {
  currentUser: AdminUser;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  loginAsUser: (userId: string) => void;
  logout: () => void;
  allUsers: AdminUser[];
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "cfc_admin_active_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<AdminUser>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);

  // Initialize from localStorage on mount
  React.useEffect(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        const found = SEEDED_ADMIN_USERS.find((u) => u.id === storedId);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      }
    } catch {
      // Ignore localStorage errors in SSR/strict modes
    }
  }, []);

  const login = (email: string, password?: string): boolean => {
    void password;
    const cleanEmail = email.trim().toLowerCase();
    const found = SEEDED_ADMIN_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY, found.id);
      } catch {
        // ignore
      }
      return true;
    }

    // Default to first user if email doesn't match
    setCurrentUser(DEFAULT_USER);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY, DEFAULT_USER.id);
    } catch {
      // ignore
    }
    return true;
  };

  const loginAsUser = (userId: string) => {
    const found = SEEDED_ADMIN_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY, found.id);
      } catch {
        // ignore
      }
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        loginAsUser,
        logout,
        allUsers: SEEDED_ADMIN_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
