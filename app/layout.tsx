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
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    type: "website",
    locale: "en_MY",
  },
}

export const viewport: Viewport = {
  themeColor: "#08090B",
  colorScheme: "dark",
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
        "antialiased bg-background dark",
        fontMono.variable,
        manrope.variable,
        spaceGrotesk.variable,
        outfit.variable,
        "font-sans"
      )}
    >
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
