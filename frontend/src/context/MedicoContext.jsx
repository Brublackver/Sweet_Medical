'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const MedicoContext = createContext(null);

export function MedicoProvider({ children }) {
  const [medico, setMedico] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('medico');
      if (stored) setMedico(JSON.parse(stored));
    } catch {
      localStorage.removeItem('medico');
    }
  }, []);

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
