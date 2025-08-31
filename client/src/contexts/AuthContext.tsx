import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Load username from localStorage on mount
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const login = (newUsername: string) => {
    const trimmedUsername = newUsername.trim();
    setUsername(trimmedUsername);
    localStorage.setItem('username', trimmedUsername);
  };

  const logout = () => {
    setUsername(null);
    localStorage.removeItem('username');
  };

  const isAuthenticated = Boolean(username);

  return (
    <AuthContext.Provider value={{ username, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}