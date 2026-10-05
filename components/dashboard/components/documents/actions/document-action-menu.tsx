// components/documents/actions/document-action-menu.tsx
"use client";

import * as React from "react";
import {
  Archive,
  Copy,
  Download,
  Edit3,
  FileSearch,
  FolderInput,
  GitCompare,
  Share2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DocumentPermission, LegalDocument } from "../types";

export interface DocumentActionMenuProps {
  document: LegalDocument;
  trigger: React.ReactNode;
  permissions?: DocumentPermission[];
  onOpen?: (doc: LegalDocument) => void;
  onRename?: (doc: LegalDocument) => void;
  onMove?: (doc: LegalDocument) => void;
  onDuplicate?: (doc: LegalDocument) => void;
  onDownload?: (doc: LegalDocument) => void;
  onShare?: (doc: LegalDocument) => void;
  onAnalyse?: (doc: LegalDocument) => void;
  onCompare?: (doc: LegalDocument) => void;
  onArchive?: (doc: LegalDocument) => void;
  onDelete?: (doc: LegalDocument) => void;
}

export function DocumentActionMenu({
  document: doc,
  trigger,
  permissions = ["view", "edit", "share", "export", "delete"],
  onOpen,
  onRename,
  onMove,
  onDuplicate,
  onDownload,
  onShare,
  onAnalyse,
  onCompare,
  onArchive,
  onDelete,
}: DocumentActionMenuProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const allow = (p: DocumentPermission) => permissions.includes(p);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {allow("view") ? (
            <DropdownMenuItem onSelect={() => onOpen?.(doc)}>
              <FileSearch className="mr-2 size-4" /> Open
            </DropdownMenuItem>
          ) : null}
          {allow("edit") ? (
            <DropdownMenuItem onSelect={() => onRename?.(doc)}>
              <Edit3 className="mr-2 size-4" /> Rename
            </DropdownMenuItem>
          ) : null}
          {allow("edit") ? (
            <DropdownMenuItem onSelect={() => onMove?.(doc)}>
              <FolderInput className="mr-2 size-4" /> Move
            </DropdownMenuItem>
          ) : null}
          {allow("edit") ? (
            <DropdownMenuItem onSelect={() => onDuplicate?.(doc)}>
              <Copy className="mr-2 size-4" /> Duplicate
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onAnalyse?.(doc)}>
            <FileSearch className="mr-2 size-4" /> Analyse
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCompare?.(doc)}>
            <GitCompare className="mr-2 size-4" /> Compare
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {allow("export") ? (
            <DropdownMenuItem onSelect={() => onDownload?.(doc)}>
              <Download className="mr-2 size-4" /> Download
            </DropdownMenuItem>
          ) : null}
          {allow("share") ? (
            <DropdownMenuItem onSelect={() => onShare?.(doc)}>
              <Share2 className="mr-2 size-4" /> Share
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          {allow("edit") ? (
            <DropdownMenuItem onSelect={() => onArchive?.(doc)}>
              <Archive className="mr-2 size-4" /> Archive
            </DropdownMenuItem>
          ) : null}
          {allow("delete") ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{doc.name}" will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(doc)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
