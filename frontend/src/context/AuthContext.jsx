import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('delivery_token');
      if (token) {
        try {
          const res = await authService.getCurrentUser();
          if (res.success) {
            setUser(res.data);
          } else {
            localStorage.removeItem('delivery_token');
          }
        } catch (err) {
          localStorage.removeItem('delivery_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success) {
      localStorage.setItem('delivery_token', res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success) {
      localStorage.setItem('delivery_token', res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('delivery_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
