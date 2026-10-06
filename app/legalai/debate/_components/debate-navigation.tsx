"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/legalai/debate", label: "Debates", icon: List, exact: true },
  { href: "/legalai/debate/new", label: "New debate", icon: Plus },
  { href: "/legalai/debate/research", label: "Legal research", icon: BookOpen },
];

export function DebateNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Debate navigation" className="flex flex-wrap gap-2">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Button
            key={href}
            asChild
            size="sm"
            variant={active ? "secondary" : "outline"}
            aria-current={active ? "page" : undefined}
            className={cn(active && "font-medium")}
          >
            <Link href={href}>
              <Icon className="mr-1.5 size-3.5" aria-hidden />
              {label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
