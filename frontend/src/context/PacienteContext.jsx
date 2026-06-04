'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PacienteContext = createContext(null);

export function PacienteProvider({ children }) {
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('paciente');
      if (stored) setPaciente(JSON.parse(stored));
    } catch {
      localStorage.removeItem('paciente');
    }
  }, []);

  const login = (data) => {
    setPaciente(data);
    localStorage.setItem('paciente', JSON.stringify(data));
  };

  const logout = () => {
    setPaciente(null);
    localStorage.removeItem('paciente');
  };

  return (
    <PacienteContext.Provider value={{ paciente, login, logout }}>
      {children}
    </PacienteContext.Provider>
  );
}

export function usePaciente() {
  return useContext(PacienteContext);
}
