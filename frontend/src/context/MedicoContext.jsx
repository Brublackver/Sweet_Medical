'use client';
import { createContext, useContext, useState } from 'react';
import { leerStorage } from '@/lib/storage';

const MedicoContext = createContext(null);

export function MedicoProvider({ children }) {
  const [medico, setMedico] = useState(() => leerStorage('medico'));

  const login = (data) => {
    setMedico(data);
    localStorage.setItem('medico', JSON.stringify(data));
  };

  const logout = () => {
    setMedico(null);
    localStorage.removeItem('medico');
  };

  return (
    <MedicoContext.Provider value={{ medico, login, logout }}>
      {children}
    </MedicoContext.Provider>
  );
}

export function useMedico() {
  return useContext(MedicoContext);
}
