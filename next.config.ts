/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cap webpack parallelism and enable its memory optimisations. This build has
  // ~90 routes and runs on small containers; without these caps the build worker
  // peaks high enough to be OOM-killed (it dies with SIGTERM, not a real error).
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
  allowedDevOrigins: ['127.0.0.1', '*.daytonaproxy01.net'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Moderate policy: tighten before public launch. Keeps inline
            // scripts/styles (Next.js) and data:/blob: (Rive/WebGL) working.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
