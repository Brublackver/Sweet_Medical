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

  const loginMedico = (data) => {
    setMedico(data);
    localStorage.setItem('medico', JSON.stringify(data));
  };

  const logoutMedico = () => {
    setMedico(null);
    localStorage.removeItem('medico');
  };

  return (
    <MedicoContext.Provider value={{ medico, loginMedico, logoutMedico }}>
      {children}
    </MedicoContext.Provider>
  );
}

export function useMedico() {
  return useContext(MedicoContext);
}
