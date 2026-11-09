/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["**.replit.dev", "127.0.0.1"],
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_PROXY_URL: process.env.CLERK_PROXY_URL || ""
  }
};

export default nextConfig;
