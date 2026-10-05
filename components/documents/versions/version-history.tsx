"use client";
import * as React from "react";
import type { DocumentVersion } from "../types";
import { VersionCard } from "./version-card";

export function VersionHistory({ versions, onSelect }: { versions: DocumentVersion[]; onSelect?: (v: DocumentVersion) => void }) {
  if (!versions.length) return <p className="p-4 text-sm text-muted-foreground">No version history yet.</p>;
  return <div className="space-y-2 p-3">{versions.map((v) => <VersionCard key={v.id} version={v} onSelect={onSelect} />)}</div>;
}
