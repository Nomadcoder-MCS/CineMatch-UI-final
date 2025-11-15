import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * AuthProvider - Manages user authentication state and persistence
 * 
 * Provides:
 * - signUp(name, email): Create new user or return existing (for "Get started")
 * - signInWithEmail(email): Sign in existing user by email only (for "Sign in")
 * - signOut(): Clear user and localStorage
 * - user: Current user object or null
 * - authReady: Boolean indicating auth hydration from localStorage is complete
 * - loading: Boolean indicating if auth is still initializing
 * - isAuthenticated: Boolean indicating if user is logged in
 * 
 * Persists user to localStorage under "cinematch_user" key
 * 
 * Usage in components:
 * - Wait for authReady before making authenticated API calls
 * - Check user for authentication status
 * - Use loading to show loading state during initialization
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false); // Flag to indicate auth hydration is complete

  // Load user from localStorage on mount (re-hydrate on refresh)
  // This effect runs once on mount and sets authReady when done
  useEffect(() => {
    const savedUser = localStorage.getItem('cinematch_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('cinematch_user');
      }
    }
    // Mark auth as ready after localStorage check completes (even if no user found)
    setLoading(false);
    setAuthReady(true);
  }, []);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('cinematch_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cinematch_user');
    }
  }, [user]);

  /**
   * Sign up - Create new user or return existing
   * Used by "Get started" flow
   * 
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @returns {Promise<Object>} User object
   */
  const signUp = async (name, email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to sign up');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  /**
   * Sign in with email only - For returning users
   * Used by "Sign in" flow
   * 
   * @param {string} email - User's email
   * @returns {Promise<Object>} User object
   * @throws {Error} If user not found (404) or other error
   */
  const signInWithEmail = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }), // No name provided
      });

      if (response.status === 404) {
        // User not found - return error with backend message
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || 'No account found for that email');
        error.status = 404;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to sign in');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  /**
   * Sign out - Clear user and localStorage
   */
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('cinematch_user');
  };

  const value = {
    user,
    loading,
    authReady,           // Flag indicating auth hydration from localStorage is complete
    signUp,              // For "Get started" flow
    signInWithEmail,     // For "Sign in" flow
    signOut,
    isAuthenticated: !!user,
    // Keep identifyUser for backward compatibility (deprecated)
    identifyUser: signUp,
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

