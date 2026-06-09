import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar    from "@/components/layout/Navbar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata = {
  title:       "Sweet Medical — Reservá tu turno",
  description: "Sistema de gestión de turnos médicos",
  icons:       { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
