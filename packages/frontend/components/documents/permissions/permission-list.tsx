"use client";
import * as React from "react";
import type { DocumentPermissionEntry, DocumentRole } from "../types";
import { PermissionEditor } from "./permission-editor";

export function PermissionList({ entries, onRoleChange, onRemove }: { entries: DocumentPermissionEntry[]; onRoleChange?: (id: string, r: DocumentRole) => void; onRemove?: (id: string) => void }) {
  return <PermissionEditor entries={entries} onRoleChange={onRoleChange} onRemove={onRemove} />;
}
