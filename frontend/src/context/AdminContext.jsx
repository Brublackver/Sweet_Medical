'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin');
      if (stored) setAdmin(JSON.parse(stored));
    } catch {
      localStorage.removeItem('admin');
    }
  }, []);

  const login = () => {
    const data = { nombre: 'Administrador' };
    setAdmin(data);
    localStorage.setItem('admin', JSON.stringify(data));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
