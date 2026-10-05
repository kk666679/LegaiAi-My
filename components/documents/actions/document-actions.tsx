"use client";
import * as React from "react";
import { DocumentDownload } from "./document-download";
import { DocumentExport, type ExportFormat } from "./document-export";
import { DocumentShare } from "./document-share";
import { DocumentDuplicate } from "./document-duplicate";
import { DocumentRename } from "./document-rename";
import { DocumentArchive } from "./document-archive";
import { DocumentDelete } from "./document-delete";
import { DocumentMove } from "./document-move";
import type { DocumentFolder, DocumentPermissionEntry, DocumentRole, LegalDocument } from "../types";

export interface DocumentActionsProps {
  document: LegalDocument;
  folders?: DocumentFolder[];
  entries?: DocumentPermissionEntry[];
  shareUrl?: string;
  onDownload?: (doc: LegalDocument) => void;
  onExport?: (doc: LegalDocument, format: ExportFormat) => void;
  onDuplicate?: (doc: LegalDocument) => void;
  onRename?: (doc: LegalDocument, name: string) => void;
  onArchive?: (doc: LegalDocument) => void;
  onDelete?: (doc: LegalDocument) => void;
  onMove?: (doc: LegalDocument, folderId: string) => void;
  onRoleChange?: (id: string, role: DocumentRole) => void;
  onRemovePermission?: (id: string) => void;
  onInvite?: (email: string, role: DocumentRole) => void;
}

export function DocumentActions(props: DocumentActionsProps) {
  const { document, folders = [], entries = [], shareUrl } = props;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DocumentShare trigger={undefined} entries={entries} shareUrl={shareUrl} onRoleChange={props.onRoleChange} onRemove={props.onRemovePermission} onInvite={props.onInvite} />
      <DocumentExport onExport={(fmt) => props.onExport?.(document, fmt)} />
      <DocumentRename document={document} onRename={props.onRename} />
      <DocumentDuplicate document={document} onDuplicate={props.onDuplicate} />
      {folders.length > 0 ? <DocumentMove document={document} folders={folders} onMove={props.onMove} /> : null}
      <DocumentArchive document={document} onArchive={props.onArchive} />
      <DocumentDelete document={document} onDelete={props.onDelete} />
    </div>
  );
}
