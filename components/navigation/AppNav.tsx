import Link from 'next/link'
import { Scale3D, FileText, Scale, BarChart3, FileCheck, Monitor, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/lib/brand'

export function AppNav() {
  return (
    <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', background: 'linear-gradient(135deg,rgba(0,200,255,0.3),rgba(120,0,255,0.2))'}}>
          <Scale3D className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="font-semibold text-lg tracking-tight font-heading text-white">{BRAND.name}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild size="sm" className="text-xs font-medium">
          <Link href="/copilot">Copilot</Link>
        </Button>
        <Button variant="ghost" asChild size="sm" className="text-xs font-medium">
          <Link href="/draft">Draft</Link>
        </Button>
        <Button variant="ghost" asChild size="sm" className="text-xs font-medium">
          <Link href="/debate">Debate</Link>
        </Button>
        <Button variant="ghost" asChild size="sm" className="text-xs font-medium">
          <Link href="/audit">Audit</Link>
        </Button>
        <Button variant="ghost" asChild size="sm" className="text-xs font-medium">
          <Link href="/monitor">Monitor</Link>
        </Button>
      </div>
    </nav>
  )
}
