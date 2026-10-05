"use client";
import * as React from "react";
import { VersionHistory } from "./version-history";
import type { DocumentVersion } from "../types";

export function DocumentVersions({ versions, onSelect }: { versions: DocumentVersion[]; onSelect?: (v: DocumentVersion) => void }) {
  return <VersionHistory versions={versions} onSelect={onSelect} />;
}
