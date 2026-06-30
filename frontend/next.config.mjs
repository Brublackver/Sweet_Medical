/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};
export default nextConfig;
