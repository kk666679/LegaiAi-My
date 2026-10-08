"use client";
import * as React from "react";
import type { DocumentEvidence } from "../types";
import { EvidenceList } from "../evidence/evidence-list";

export function AnalysisEvidence({ items, onSelect }: { items: DocumentEvidence[]; onSelect?: (e: DocumentEvidence) => void }) {
  return <EvidenceList items={items} onSelect={onSelect} />;
}
