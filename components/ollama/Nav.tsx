import { BRAND } from '@/lib/brand';

"use client"

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Scale, FileText, Award, FileCheck2, Activity, BookOpen, BarChart3 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/ollama', label: 'Home', icon: BookOpen },
  { href: '/ollama/agent', label: 'Copilot', icon: Scale, active: true },
  { href: '/ollama/draft', label: 'Draft', icon: FileText },
  { href: '/ollama/debate', label: 'Debate', icon: Award },
  { href: '/ollama/audit', label: 'Audit', icon: FileCheck2 },
  { href: '/ollama/monitor', label: 'Monitor', icon: Activity },
] as const

export function Nav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Link href="/ollama" className="flex items-center gap-3 group">
        <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform" 
             style={{
               clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
               background: 'linear-gradient(135deg,rgba(0,200,255,0.3),rgba(120,0,255,0.2))'
             }}>
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="font-semibold text-white font-heading" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
{BRAND.name}
        </span>
      </Link>
      <div className="flex items-center gap-2 text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all border",
                isActive 
                  ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 font-medium" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-white/10"
              )}
            >
              <Icon className="w-3.5 h-3.5 inline mr-1" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
