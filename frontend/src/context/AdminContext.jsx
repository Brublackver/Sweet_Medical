import { createContext, useContext, useState } from 'react';
import { leerStorage } from '@/lib/storage';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => leerStorage('admin'));

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
