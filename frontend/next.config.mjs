/** @type {import('next').NextConfig} */

/*
  Proxy del frontend hacia el backend: todo /backend/* se reenvía al servicio de
  la API.

  OJO — esto se resuelve en TIEMPO DE BUILD. Next evalúa rewrites() durante
  `next build` y escribe el destino como texto fijo en .next/routes-manifest.json.
  Cambiar BACKEND_URL después NO tiene efecto: hay que reconstruir.

  En producción la variable es obligatoria y su ausencia corta el build. Antes se
  caía en silencio a localhost:3000, que dentro de un contenedor no es el backend
  sino la nada: la app compilaba, desplegaba y no hablaba con nadie. Un build que
  falla ruidoso es mucho más barato que un deploy verde que no funciona.
*/
const nextConfig = {
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || '').trim();

    if (!backendUrl && process.env.NODE_ENV === 'production') {
      throw new Error(
        'BACKEND_URL no está definida y el build de producción la necesita para ' +
        'resolver /backend/*. Definila en frontend/.env.production o pasala como ' +
        'build arg al Dockerfile (--build-arg BACKEND_URL=https://...).'
      );
    }

    // La barra final duplicaría la del patrón (//auth/demo) y el backend
    // respondería 404, así que se normaliza acá y no en cada quien la configure.
    const destino = (backendUrl || 'http://localhost:3000').replace(/\/+$/, '');

    return [
      {
        source: '/backend/:path*',
        destination: `${destino}/:path*`,
      },
    ];
  },
};
export default nextConfig;
