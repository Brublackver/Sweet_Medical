import { createContext, useContext, useState } from 'react';
import { leerStorage } from '@/lib/storage';

const PacienteContext = createContext(null);

export function PacienteProvider({ children }) {
  const [paciente, setPaciente] = useState(() => leerStorage('paciente'));

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
