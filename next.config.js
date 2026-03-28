/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ORCHESTRATOR_URL: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ?? 'http://localhost:3001',
  },
};

module.exports = nextConfig;
