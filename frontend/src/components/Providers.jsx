'use client';

import { PacienteProvider } from '@/context/PacienteContext';
import { CarritoProvider }  from '@/context/CarritoContext';
import { MedicoProvider }   from '@/context/MedicoContext';
import { AdminProvider }    from '@/context/AdminContext';

export default function Providers({ children }) {
  return (
    <AdminProvider>
      <PacienteProvider>
        <MedicoProvider>
          <CarritoProvider>
            {children}
          </CarritoProvider>
        </MedicoProvider>
      </PacienteProvider>
    </AdminProvider>
  );
}
