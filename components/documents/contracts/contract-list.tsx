"use client";
import * as React from "react";
import type { LegalDocument } from "../types";
import { ContractCard } from "./contract-card";

export function ContractList({ contracts, onOpen }: { contracts: LegalDocument[]; onOpen?: (d: LegalDocument) => void }) {
  return <div className="space-y-2">{contracts.map((c) => <ContractCard key={c.id} contract={c} onOpen={onOpen} />)}</div>;
}
