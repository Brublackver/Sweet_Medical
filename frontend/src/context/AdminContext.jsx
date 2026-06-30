'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { leerStorage } from '@/lib/storage';
import { limpiarToken } from '@/lib/api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin]   = useState(null);
  const [cargado, setCargado] = useState(false);

  // Leemos localStorage DESPUÉS del montaje (no en el render inicial) para que
  // el primer render del cliente coincida con el del servidor (ambos null) y no
  // haya hydration mismatch. `cargado` avisa que ya terminó de leer la sesión:
  // los consumidores deben esperar a `cargado` antes de redirigir a /login.
  useEffect(() => {
    setAdmin(leerStorage('admin'));
    setCargado(true);
  }, []);

  const login = () => {
    const data = { nombre: 'Administrador' };
    setAdmin(data);
    localStorage.setItem('admin', JSON.stringify(data));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
    limpiarToken();
  };

  return (
    <AdminContext.Provider value={{ admin, cargado, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
