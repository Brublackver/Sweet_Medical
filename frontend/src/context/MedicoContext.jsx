'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { leerStorage } from '@/lib/storage';
import { limpiarToken } from '@/lib/api';

const MedicoContext = createContext(null);

export function MedicoProvider({ children }) {
  const [medico, setMedico] = useState(null);
  const [cargado, setCargado] = useState(false);

  // Leemos localStorage DESPUÉS del montaje (no en el render inicial) para que
  // el primer render del cliente coincida con el del servidor (ambos null) y no
  // haya hydration mismatch. `cargado` avisa que ya terminó de leer la sesión:
  // los consumidores deben esperar a `cargado` antes de redirigir a /login.
  useEffect(() => {
    setMedico(leerStorage('medico'));
    setCargado(true);
  }, []);

  const login = (data) => {
    setMedico(data);
    localStorage.setItem('medico', JSON.stringify(data));
  };

  const logout = () => {
    setMedico(null);
    localStorage.removeItem('medico');
    limpiarToken();
  };

  return (
    <MedicoContext.Provider value={{ medico, cargado, login, logout }}>
      {children}
    </MedicoContext.Provider>
  );
}

export function useMedico() {
  return useContext(MedicoContext);
}
