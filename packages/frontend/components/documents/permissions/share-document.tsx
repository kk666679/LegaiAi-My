// components/documents/permissions/share-document.tsx
"use client";

import * as React from "react";
import { Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentPermissionEntry, DocumentRole } from "../types";
import { PermissionEditor } from "./permission-editor";

export interface ShareDocumentProps {
  entries: DocumentPermissionEntry[];
  shareUrl?: string;
  onRoleChange?: (id: string, role: DocumentRole) => void;
  onRemove?: (id: string) => void;
  onInvite?: (email: string, role: DocumentRole) => void;
  onCopyLink?: () => void;
}

export function ShareDocument({
  entries,
  shareUrl,
  onRoleChange,
  onRemove,
  onInvite,
  onCopyLink,
}: ShareDocumentProps) {
  const [email, setEmail] = React.useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add people by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.trim()) {
              onInvite?.(email.trim(), "viewer");
              setEmail("");
            }
          }}
        />
        <Button
          onClick={() => {
            if (email.trim()) {
              onInvite?.(email.trim(), "viewer");
              setEmail("");
            }
          }}
        >
          Invite
        </Button>
      </div>

      <PermissionEditor
        entries={entries}
        onRoleChange={onRoleChange}
        onRemove={onRemove}
      />

      {shareUrl ? (
        <div className="flex items-center gap-2">
          <Input value={shareUrl} readOnly />
          <Button
            variant="outline"
            size="icon"
            aria-label="Copy link"
            onClick={onCopyLink}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="gap-2">
          <LinkIcon className="size-4" /> Create share link
        </Button>
      )}
    </div>
  );
}
