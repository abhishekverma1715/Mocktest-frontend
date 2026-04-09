import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password, role = 'user') => {
    let endpoint = '/auth/login';
    if (role === 'admin') endpoint = '/auth/admin-login';
    if (role === 'teacher') endpoint = '/auth/teacher-login';
    const { data } = await API.post(endpoint, { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast.success('Account created successfully!');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  // Memoize premium status to avoid recalculating on every render
  const isPremium = useMemo(() => {
    if (!user?.membership) return false;
    return user.membership.status === 'premium' && 
           new Date(user.membership.endDate) > new Date();
  }, [user?.membership?.status, user?.membership?.endDate]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    darkMode,
    setDarkMode,
    isPremium, // Pre-computed premium status
  }), [user, loading, darkMode, isPremium]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
