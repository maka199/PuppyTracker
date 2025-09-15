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
      // Kontrollera mot backend om användaren finns
      const checkUser = async () => {
        try {
          const apiBase = window.location.hostname.includes('localhost') ? 'http://localhost:5000' : 'https://puppytracker.onrender.com';
          const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(savedUsername)}`);
          if (res.ok) {
            setUsername(savedUsername);
          } else {
            // Användaren finns inte i databasen, logga ut
            setUsername(null);
            localStorage.removeItem('username');
          }
        } catch {
          setUsername(null);
          localStorage.removeItem('username');
        }
      };
      checkUser();
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
  window.location.href = "/";
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