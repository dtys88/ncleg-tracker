/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fetching from ncleg.gov APIs on the server side
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
