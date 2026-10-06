"use client";
import * as React from "react";
import type { Contract } from "../types";
import { ContractCard } from "./contract-card";

export function ContractGrid({ contracts, onOpen, onFavoriteChange, onMenu }: { contracts: Contract[]; onOpen?: (c: Contract) => void; onFavoriteChange?: (c: Contract, next: boolean) => void; onMenu?: (c: Contract, anchor: HTMLElement) => void }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{contracts.map((c) => <ContractCard key={c.id} contract={c} onOpen={onOpen} onFavoriteChange={onFavoriteChange} onMenu={onMenu} />)}</div>;
}
