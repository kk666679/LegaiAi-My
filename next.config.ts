/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * Build stability
   *
   * The application has ~90 routes and may be built in small containers.
   * Limit webpack parallelism to reduce peak memory usage and avoid
   * SIGTERM/OOM failures during production builds.
   */
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
  },

  /*
   * TypeScript
   *
   * Use the dedicated Next.js TypeScript configuration rather than the
   * repository-wide tsconfig.
   */
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },

  /*
   * Development origins
   *
   * Restrict cross-origin development requests to known development
   * hosts. Production behavior should not depend on this setting.
   */
  allowedDevOrigins: [
    '127.0.0.1',
    '*.daytonaproxy01.net',
  ],

  /*
   * Security headers
   */
  async headers() {
    return [
      {
        source: '/:path*',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
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
    ];
  },
};

export default nextConfig;