import Nav from '@/components/legalai/Nav'

export default function LegalAILayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="content-width safe-x page-gutter min-w-0 py-6 sm:py-8 lg:py-12">{children}</main>
    </>
  )
}
