/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // these folders are outside of app/, the import boundaries are checked there
    dirs: ['app', 'core', 'infrastructure', 'contracts'],
  },
  images: {
    remotePatterns: [
      { hostname: 'res.cloudinary.com' },
      { hostname: 'i.citrus.world' },
    ],
  },
};

module.exports = withPWA(nextConfig);
