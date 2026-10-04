import { Toaster } from '@/components/ui/sonner'

// The /legalai app shell (sidebar, top bar, breadcrumbs, mobile
// navigation) is provided by DashboardShell inside each page. This
// layout intentionally renders no additional chrome so the shell is
// not duplicated.
export default function LegalAILayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  )
}
