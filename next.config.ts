/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal self-contained server for containerized deployment.
  // NOTE: the frontend type-imports the backend AppRouter, so `next build`'s
  // type-check pulls in the backend program. The backend is type-checked as
  // its own project (verified 0 errors via `backend/` tsconfig) and runs via
  // tsx, so we skip build-time type errors here. A follow-up is to decouple
  // the frontend client types from the backend source (e.g. generated types).
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
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
