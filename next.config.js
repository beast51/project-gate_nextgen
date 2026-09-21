/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'res.cloudinary.com' },
      { hostname: 'i.citrus.world' },
    ],
  },
};

// next-pwa plugs into webpack and knows nothing about Turbopack, the default bundler since Next.js 16.
// Development runs on Turbopack without the service worker (it was disabled in development anyway),
// the production build uses webpack: `next build --webpack`, see package.json.
const isDevelopment = process.env.NODE_ENV === 'development';

const withPWA = isDevelopment
  ? (config) => config
  : require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
    });

module.exports = withPWA(nextConfig);
