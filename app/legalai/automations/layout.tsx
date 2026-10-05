import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lawmate — Workflow builder',
  description: 'Build clear, automated legal workflows with Lawmate.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/lawmate-logo/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/lawmate-logo/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/lawmate-logo/favicon-dark-32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/lawmate-logo/lawmate-mark.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/lawmate-logo/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0891B2' },
    { media: '(prefers-color-scheme: dark)', color: '#0891B2' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}