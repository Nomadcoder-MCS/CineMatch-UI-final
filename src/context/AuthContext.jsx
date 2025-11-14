import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cinematch_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('cinematch_user');
      }
    }
    setLoading(false);
  }, []);

  // Identify or create user
  const identifyUser = async (name, email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to identify user');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('cinematch_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error identifying user:', error);
      throw error;
    }
  };

  // Sign out (clear user)
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('cinematch_user');
  };

  const value = {
    user,
    loading,
    identifyUser,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

