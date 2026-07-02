'use client';
import Providers from './Providers';
import Navbar    from './layout/Navbar';
import ToastHost from './ui/ToastHost';

export default function ClientShell({ children }) {
  return (
    <Providers>
      <Navbar />
      <main id="contenido">{children}</main>
      <ToastHost />
    </Providers>
  );
}
