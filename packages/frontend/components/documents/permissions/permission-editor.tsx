// components/documents/permissions/permission-editor.tsx
"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentPermissionEntry, DocumentRole } from "../types";

export interface PermissionEditorProps {
  entries: DocumentPermissionEntry[];
  onRoleChange?: (id: string, role: DocumentRole) => void;
  onRemove?: (id: string) => void;
}

const ROLES: DocumentRole[] = ["owner", "editor", "reviewer", "viewer"];

export function PermissionEditor({
  entries,
  onRoleChange,
  onRemove,
}: PermissionEditorProps) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const initials = entry.name
          .split(" ")
          .map((s) => s[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-8">
                {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                {entry.email ? (
                  <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={entry.role}
                onValueChange={(v) => onRoleChange?.(entry.id, v as DocumentRole)}
              >
                <SelectTrigger className="h-8 w-[110px] capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entry.role !== "owner" && onRemove ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  aria-label={`Remove ${entry.name}`}
                  onClick={() => onRemove(entry.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
