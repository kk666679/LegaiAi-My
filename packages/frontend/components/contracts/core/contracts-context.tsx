"use client";
import * as React from "react";
import type { Contract, ContractCapabilities, ContractFilters, ContractSort } from "../types";

interface ContractsContextValue {
  contracts: Contract[];
  filters: ContractFilters;
  sort: ContractSort;
  capabilities: ContractCapabilities;
  selectedId: string | null;
  setFilters: (next: Partial<ContractFilters>) => void;
  resetFilters: () => void;
  setSort: (next: ContractSort) => void;
  setSelectedId: (id: string | null) => void;
  getContract: (id: string) => Contract | undefined;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  removeContract: (id: string) => void;
}

const ContractsContext = React.createContext<ContractsContextValue | null>(null);

const DEFAULT_CAPS: ContractCapabilities = {
  canEdit: true, canAnalyse: true, canNegotiate: true, canApprove: true,
  canExecute: true, canRenew: true, canTerminate: true, canDelete: true,
};
const DEFAULT_SORT: ContractSort = { key: "updatedAt", direction: "desc" };

export interface ContractsProviderProps {
  children: React.ReactNode;
  contracts: Contract[];
  capabilities?: Partial<ContractCapabilities>;
  initialFilters?: ContractFilters;
  initialSort?: ContractSort;
}

export function ContractsProvider({ children, contracts: initial, capabilities, initialFilters = {}, initialSort = DEFAULT_SORT }: ContractsProviderProps) {
  const [contracts, setContracts] = React.useState(initial);
  const [filters, setFiltersState] = React.useState<ContractFilters>(initialFilters);
  const [sort, setSort] = React.useState<ContractSort>(initialSort);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => setContracts(initial), [initial]);

  const setFilters = React.useCallback((next: Partial<ContractFilters>) => setFiltersState((p) => ({ ...p, ...next })), []);
  const resetFilters = React.useCallback(() => setFiltersState({}), []);
  const getContract = React.useCallback((id: string) => contracts.find((c) => c.id === id), [contracts]);
  const updateContract = React.useCallback((id: string, patch: Partial<Contract>) => setContracts((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c))), []);
  const removeContract = React.useCallback((id: string) => setContracts((p) => p.filter((c) => c.id !== id)), []);

  const value = React.useMemo<ContractsContextValue>(() => ({
    contracts, filters, sort, selectedId,
    capabilities: { ...DEFAULT_CAPS, ...capabilities },
    setFilters, resetFilters, setSort, setSelectedId,
    getContract, updateContract, removeContract,
  }), [contracts, filters, sort, selectedId, capabilities, setFilters, resetFilters, getContract, updateContract, removeContract]);

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts(): ContractsContextValue {
  const ctx = React.useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used inside <ContractsProvider>.");
  return ctx;
}
