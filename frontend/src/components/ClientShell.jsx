'use client';
import Providers from './Providers';
import Navbar    from './layout/Navbar';

export default function ClientShell({ children }) {
  return (
    <Providers>
      <Navbar />
      <main id="contenido">{children}</main>
    </Providers>
  );
}
