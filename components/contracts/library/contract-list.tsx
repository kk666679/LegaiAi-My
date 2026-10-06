"use client";
import * as React from "react";
import type { Contract } from "../types";
import { ContractRow } from "./contract-row";

export function ContractList({ contracts, onOpen, onMenu }: { contracts: Contract[]; onOpen?: (c: Contract) => void; onMenu?: (c: Contract, anchor: HTMLElement) => void }) {
  return <div className="space-y-2">{contracts.map((c) => <ContractRow key={c.id} contract={c} onOpen={onOpen} onMenu={onMenu} />)}</div>;
}
