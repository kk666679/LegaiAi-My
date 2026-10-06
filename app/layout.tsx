import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Manrope } from "next/font/google"
import { Space_Grotesk, Outfit } from "next/font/google"
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

const fontMono = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"]
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"]
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "legal AI",
    "legal AI platform",
    "law mate",
    "AI agents",
    "legal research",
    "contract analysis",
    "document drafting",
    "matter management",
  ],
  authors: [{ name: BRAND.legalName }],
  icons: {
    icon: [
      { url: "/lawmate-logo/favicon.ico", sizes: "any" },
      { url: "/lawmate-logo/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/lawmate-logo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/lawmate-logo/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/lawmate-logo/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/lawmate-logo/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/lawmate-logo/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/lawmate-logo/favicon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/lawmate-logo/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/lawmate-logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/lawmate-logo/favicon-dark.ico", sizes: "any", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-48.png", sizes: "48x48", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-64.png", sizes: "64x64", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-96.png", sizes: "96x96", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-128.png", sizes: "128x128", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-256.png", sizes: "256x256", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/lawmate-logo/favicon-dark-512.png", sizes: "512x512", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  manifest: "/lawmate-logo/site.webmanifest",
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    type: "website",
    locale: "en_MY",
  },
}

export const viewport: Viewport = {
  themeColor: "hsl(var(--brand-blue))",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased bg-background",
        fontMono.variable,
        manrope.variable,
        spaceGrotesk.variable,
        outfit.variable,
        "font-sans",
      )}
    >
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
