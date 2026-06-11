import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.9', 'localhost', '127.0.0.1'],
  reactStrictMode: true,
  transpilePackages: ['react-markdown', 'rehype-highlight', 'highlight.js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    return [
      // Proxy socket connections in production to avoid CORS
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ]
  },
  // Expose backend URLs to client
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || '',
    NEXT_PUBLIC_TRANSCRIPTION_URL: process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || '',
  }
};

export default nextConfig;
