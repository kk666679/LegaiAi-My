import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Manrope, Space_Grotesk, Outfit } from "next/font/google"
import { cookies, headers } from "next/headers"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { BRAND } from "@/lib/brand"
import { I18nProvider } from "@/i18n/providers/i18n-provider"
import { getFallbackMessages, loadMessages } from "@/i18n/messages"
import {
  detectFromHeader,
  localeDirections,
  LOCALE_COOKIE,
  toLocale,
} from "@/i18n/config/locales"

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
  weight: ["400", "500", "600", "700"],
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = cookieLocale
    ? toLocale(cookieLocale)
    : detectFromHeader(headerStore.get("accept-language"))

  const messages = loadMessages(locale)
  const fallbackMessages = locale === "en" ? undefined : getFallbackMessages()
  const dir = localeDirections[locale]

  return (
    <html
      lang={locale}
      dir={dir}
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
        <I18nProvider
          locale={locale}
          messages={messages}
          fallbackMessages={fallbackMessages}
        >
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
