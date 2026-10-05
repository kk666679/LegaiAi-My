"use client";
import * as React from "react";
import type { DocumentPermissionEntry, DocumentRole } from "../types";
import { PermissionList } from "./permission-list";
import { AccessSummary, type AccessLevel } from "./access-summary";

export function DocumentPermissions({ entries, level = "team", onRoleChange, onRemove }: { entries: DocumentPermissionEntry[]; level?: AccessLevel; onRoleChange?: (id: string, r: DocumentRole) => void; onRemove?: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <AccessSummary level={level} count={entries.length} />
      <PermissionList entries={entries} onRoleChange={onRoleChange} onRemove={onRemove} />
    </div>
  );
}
