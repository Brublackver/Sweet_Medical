import '@/globals.css';
import ClientShell from '@/components/ClientShell';

export const metadata = {
  title: 'Sweet Medical',
  description: 'Sistema de gestión de turnos médicos',
  // Favicon: la cruz roja médica de public/favicon.svg. Sin esto, Next no la
  // enchufa y el navegador muestra su globo genérico por defecto.
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
