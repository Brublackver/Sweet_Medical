'use client';

import { PacienteProvider } from '@/context/PacienteContext';
import { CarritoProvider }  from '@/context/CarritoContext';
import { MedicoProvider }   from '@/context/MedicoContext';

export default function Providers({ children }) {
  return (
    <PacienteProvider>
      <MedicoProvider>
        <CarritoProvider>
          {children}
        </CarritoProvider>
      </MedicoProvider>
    </PacienteProvider>
  );
}
