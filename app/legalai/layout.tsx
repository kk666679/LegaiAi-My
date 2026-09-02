import Nav from '@/components/legalai/Nav'
import { Toaster } from '@/components/ui/sonner'

export default function LegalAILayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="content-width safe-x page-gutter min-w-0 py-6 sm:py-8 lg:py-12">{children}</main>
      <Toaster richColors position="top-right" />
    </>
  )
}
