/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Pass environment variables to the browser bundle
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
    NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/",
  },

  // Allow Next.js <Image> to load evidence thumbnails from IPFS gateway
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },

  // Rewrite /api/* to the FastAPI backend so the frontend never
  // exposes the backend origin in the browser (removes CORS issues in prod)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
