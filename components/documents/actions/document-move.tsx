"use client";
import * as React from "react";
import { FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderSelector } from "../organization/folder-selector";
import type { DocumentFolder, LegalDocument } from "../types";

export function DocumentMove({ document, folders, onMove }: { document: LegalDocument; folders: DocumentFolder[]; onMove?: (doc: LegalDocument, folderId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [folderId, setFolderId] = React.useState(document.folderId ?? "");
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><FolderInput className="mr-1.5 size-3.5" />Move</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move document</DialogTitle></DialogHeader>
          <FolderSelector folders={folders} value={folderId} onChange={setFolderId} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onMove?.(document, folderId); setOpen(false); }}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
