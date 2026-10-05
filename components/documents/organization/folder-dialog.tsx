"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderSelector } from "./folder-selector";
import type { DocumentFolder } from "../types";

export interface FolderDialogProps { open: boolean; onOpenChange: (o: boolean) => void; folders?: DocumentFolder[]; onSubmit?: (payload: { name: string; parentId?: string }) => void; initial?: { name?: string; parentId?: string }; }

export function FolderDialog({ open, onOpenChange, folders = [], onSubmit, initial }: FolderDialogProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [parentId, setParentId] = React.useState(initial?.parentId ?? "");
  React.useEffect(() => { if (open) { setName(initial?.name ?? ""); setParentId(initial?.parentId ?? ""); } }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{initial?.name ? "Rename folder" : "New folder"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" aria-label="Folder name" />
          {folders.length > 0 ? <FolderSelector folders={folders} value={parentId} onChange={setParentId} placeholder="Parent (optional)" /> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSubmit?.({ name, parentId: parentId || undefined }); onOpenChange(false); }} disabled={!name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
