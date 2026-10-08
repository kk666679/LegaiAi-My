"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Archive, BookTemplate, Clock, FileSignature, FileText,
  PenLine, Share2, Star, Trash2, Sparkles, Library, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/lawmate/documents", label: "All documents", icon: <FileText className="size-4" />, exact: true },
  { href: "/lawmate/documents/recent", label: "Recent", icon: <History className="size-4" /> },
  { href: "/lawmate/documents?status=draft", label: "Drafts", icon: <PenLine className="size-4" /> },
  { href: "/lawmate/documents?status=review", label: "In review", icon: <Clock className="size-4" /> },
  { href: "/lawmate/documents/favorites", label: "Favorites", icon: <Star className="size-4" /> },
  { href: "/lawmate/documents/shared", label: "Shared with me", icon: <Share2 className="size-4" /> },
  { href: "/lawmate/documents/templates", label: "Templates", icon: <BookTemplate className="size-4" /> },
  { href: "/lawmate/documents/studio", label: "Drafting Studio", icon: <Sparkles className="size-4" /> },
  { href: "/lawmate/documents/library", label: "Library", icon: <Library className="size-4" /> },
  { href: "/lawmate/contracts", label: "Contracts", icon: <FileSignature className="size-4" /> },
  { href: "/lawmate/documents?status=archived", label: "Archived", icon: <Archive className="size-4" /> },
  { href: "/lawmate/documents/trash", label: "Trash", icon: <Trash2 className="size-4" /> },
];

export function DocumentsSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <FileText className="size-4" />
        </div>
        <p className="text-sm font-semibold">Documents</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Documents">
          <ul className="space-y-0.5">
            {LINKS.map((l, i) => {
              const query = l.href.includes("?") ? l.href.split("?")[1] : undefined;
              const queryMatches = query
                ? new URLSearchParams(query).toString() === searchParams.toString()
                : !searchParams.toString();
              const isStudioRoute = l.href === "/lawmate/documents/studio" &&
                (pathname === l.href || /^\/lawmate\/documents\/[^/]+\/studio$/.test(pathname));
              const active = isStudioRoute || (l.exact
                ? pathname === l.href && queryMatches
                : query
                  ? pathname === "/lawmate/documents" && queryMatches
                  : pathname === l.href || pathname.startsWith(`${l.href}/`));
              return (
                <li key={`${l.href}-${i}`}>
                  <Button
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("w-full justify-start gap-2", active && "font-medium")}
                  >
                    <Link href={l.href} aria-current={active ? "page" : undefined}>
                      {l.icon}
                      {l.label}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
}
