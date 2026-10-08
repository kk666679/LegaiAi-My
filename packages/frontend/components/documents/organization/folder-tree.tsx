"use client";
import * as React from "react";
import { ChevronRight, Folder, FolderOpen, Star, Clock, Archive, Share2, FileSignature, PenLine, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { DocumentFolder } from "../types";

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  recent: <Clock className="size-4" />,
  favorites: <Star className="size-4" />,
  shared: <Share2 className="size-4" />,
  contracts: <FileSignature className="size-4" />,
  drafts: <PenLine className="size-4" />,
  templates: <LayoutTemplate className="size-4" />,
  archived: <Archive className="size-4" />,
};

export interface FolderTreeProps { folders: DocumentFolder[]; activeId?: string | null; onSelect?: (id: string | null) => void; className?: string; }

function FolderNode({ folder, activeId, onSelect, level = 0 }: { folder: DocumentFolder; activeId?: string | null; onSelect?: (id: string | null) => void; level?: number }) {
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const [open, setOpen] = React.useState(true);
  const active = activeId === folder.id;
  const icon = folder.system ? SYSTEM_ICONS[folder.id] : open && hasChildren ? <FolderOpen className="size-4" /> : <Folder className="size-4" />;
  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant={active ? "secondary" : "ghost"} size="sm"
            className={cn("w-full justify-start gap-1.5", active && "font-medium")}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect?.(folder.id)}>
            {hasChildren ? <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} /> : <span className="size-3" />}
            {icon}
            <span className="flex-1 truncate text-left">{folder.name}</span>
            {typeof folder.count === "number" ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{folder.count}</span> : null}
          </Button>
        </CollapsibleTrigger>
        {hasChildren ? (
          <CollapsibleContent>
            <ul className="space-y-0.5">
              {folder.children!.map((c) => <FolderNode key={c.id} folder={c} activeId={activeId} onSelect={onSelect} level={level + 1} />)}
            </ul>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </li>
  );
}

export function FolderTree({ folders, activeId, onSelect, className }: FolderTreeProps) {
  return (
    <nav aria-label="Folders" className={className}>
      <ul className="space-y-0.5">
        {folders.map((f) => <FolderNode key={f.id} folder={f} activeId={activeId} onSelect={onSelect} />)}
      </ul>
    </nav>
  );
}
