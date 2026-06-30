'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { leerStorage } from '@/lib/storage';
import { limpiarToken } from '@/lib/api';

const PacienteContext = createContext(null);

export function PacienteProvider({ children }) {
  const [paciente, setPaciente] = useState(null);
  const [cargado, setCargado]   = useState(false);

  // Leemos localStorage DESPUÉS del montaje (no en el render inicial) para que
  // el primer render del cliente coincida con el del servidor (ambos null) y no
  // haya hydration mismatch. `cargado` avisa que ya terminó de leer la sesión:
  // los consumidores deben esperar a `cargado` antes de redirigir a /login.
  useEffect(() => {
    setPaciente(leerStorage('paciente'));
    setCargado(true);
  }, []);

  const login = (data) => {
    setPaciente(data);
    localStorage.setItem('paciente', JSON.stringify(data));
  };

  const logout = () => {
    setPaciente(null);
    localStorage.removeItem('paciente');
    limpiarToken();
  };

  return (
    <PacienteContext.Provider value={{ paciente, cargado, login, logout }}>
      {children}
    </PacienteContext.Provider>
  );
}

export function usePaciente() {
  return useContext(PacienteContext);
}
