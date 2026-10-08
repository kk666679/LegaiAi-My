"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentFolder } from "../types";
import { FolderTree } from "../organization/folder-tree";

export interface DocumentSidebarProps { folders: DocumentFolder[]; activeFolderId?: string | null; onFolderSelect?: (id: string | null) => void; templatesSlot?: React.ReactNode; className?: string; }

export function DocumentSidebar({ folders, activeFolderId, onFolderSelect, templatesSlot, className }: DocumentSidebarProps) {
  const [tab, setTab] = React.useState<"folders" | "templates">("folders");
  return (
    <div className={className}>
      <div className="border-b border-border/60 px-3 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="folders" className="flex-1">Folders</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="h-[calc(100%-3.5rem)]">
        {tab === "folders" ? <div className="p-2"><FolderTree folders={folders} activeId={activeFolderId} onSelect={onFolderSelect} /></div> : <div className="p-3">{templatesSlot ?? <p className="text-xs text-muted-foreground">No templates.</p>}</div>}
      </ScrollArea>
    </div>
  );
}
