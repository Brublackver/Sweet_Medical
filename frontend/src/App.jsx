import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Providers          from '@/components/Providers';
import Navbar             from '@/components/layout/Navbar';
import LoginPage          from '@/features/login/LoginPage';
import AdminPage          from '@/features/admin/AdminPage';
import BuscarPage         from '@/features/busqueda/BuscarPage';
import MisTurnosPage      from '@/features/misturno/MisTurnosPage';
import CarritoPage        from '@/features/carrito/CarritoPage';
import ConfirmacionPage   from '@/features/confirmacion/ConfirmacionPage';
import DisponibilidadPage from '@/features/medico/DisponibilidadPage';
import MedicoTurnosPage   from '@/features/medico/MedicoTurnosPage';

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Navbar />
        <main>
          <Routes>
            <Route path="/login"                   element={<LoginPage />} />
            <Route path="/admin"                   element={<AdminPage />} />
            <Route path="/buscar"                  element={<BuscarPage />} />
            <Route path="/mis-turnos"              element={<MisTurnosPage />} />
            <Route path="/solicitudes"             element={<CarritoPage />} />
            <Route path="/confirmar"               element={<ConfirmacionPage />} />
            <Route path="/medico/disponibilidad"   element={<DisponibilidadPage />} />
            <Route path="/medico/turnos"           element={<MedicoTurnosPage />} />
            <Route path="*"                        element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </Providers>
    </BrowserRouter>
  );
}
