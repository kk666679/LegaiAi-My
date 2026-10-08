"use client";
import * as React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShareDocument } from "../permissions/share-document";
import type { DocumentPermissionEntry, DocumentRole } from "../types";

export interface DocumentShareProps {
  trigger?: React.ReactNode;
  entries: DocumentPermissionEntry[];
  shareUrl?: string;
  onRoleChange?: (id: string, role: DocumentRole) => void;
  onRemove?: (id: string) => void;
  onInvite?: (email: string, role: DocumentRole) => void;
}

export function DocumentShare({ trigger, entries, shareUrl, onRoleChange, onRemove, onInvite }: DocumentShareProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? <Button size="sm" variant="outline"><Share2 className="mr-1.5 size-3.5" />Share</Button>}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
            <DialogDescription>Invite collaborators and manage roles.</DialogDescription>
          </DialogHeader>
          <ShareDocument entries={entries} shareUrl={shareUrl} onRoleChange={onRoleChange} onRemove={onRemove} onInvite={onInvite} onCopyLink={() => navigator.clipboard?.writeText(shareUrl ?? "")} />
        </DialogContent>
      </Dialog>
    </>
  );
}
