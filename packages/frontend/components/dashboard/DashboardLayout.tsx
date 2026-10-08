import { BRAND } from '@/lib/brand';

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppNav } from '@/components/navigation/AppNav'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu } from 'lucide-react' // Assume lucide

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r bg-background">
          <AppNav />
        </SheetContent>
      </Sheet>

      {/* Sidebar Desktop */}
      <div className="hidden border-r md:block md:w-64 lg:w-72">
        <div className="flex h-full flex-col gap-2 p-4 lg:px-6">
          <div className="flex h-16 shrink-0 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-6 w-6 rounded bg-primary/10" /> {/* Logo */}
{BRAND.name}
            </div>
          </div>
          <AppNav />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-[73px]">
        {/* Header */}
        <header className="border-b bg-background/75 sticky top-0 z-40 supports-[backdrop-filter]:backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                New Query
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden md:p-6 lg:p-8">
            <div className="container mx-auto h-full w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

