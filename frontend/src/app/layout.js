import '@/globals.css';
import ClientShell from '@/components/ClientShell';

export const metadata = {
  title: 'Sweet Medical',
  description: 'Sistema de gestión de turnos médicos',
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
