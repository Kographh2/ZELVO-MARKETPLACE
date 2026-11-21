/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'qrcode', 'midtrans-client', 'satori'],
    outputFileTracingIncludes: {
      '/api/**/*': ['./assets/fonts/**/*'],
    },
  },
};
export default nextConfig;
