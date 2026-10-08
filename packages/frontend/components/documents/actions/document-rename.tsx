"use client";
import * as React from "react";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { LegalDocument } from "../types";

export function DocumentRename({ document, onRename }: { document: LegalDocument; onRename?: (doc: LegalDocument, name: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(document.name);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Edit3 className="mr-1.5 size-3.5" />Rename</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename document</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Document name" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onRename?.(document, name); setOpen(false); }}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
