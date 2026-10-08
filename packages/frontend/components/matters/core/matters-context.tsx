// components/matters/core/matters-context.tsx
"use client";

import * as React from "react";
import type {
  Matter,
  MatterCapabilities,
  MatterFilters,
  MatterSort,
} from "../types";

interface MattersContextValue {
  matters: Matter[];
  filters: MatterFilters;
  sort: MatterSort;
  capabilities: MatterCapabilities;
  setFilters: (next: Partial<MatterFilters>) => void;
  resetFilters: () => void;
  setSort: (next: MatterSort) => void;
  getMatter: (id: string) => Matter | undefined;
  updateMatter: (id: string, patch: Partial<Matter>) => void;
  removeMatter: (id: string) => void;
}

const MattersContext = React.createContext<MattersContextValue | null>(null);

const DEFAULT_CAPS: MatterCapabilities = {
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canClose: true,
  canReopen: true,
  canBill: true,
  canShare: true,
  canRunConflicts: true,
};

const DEFAULT_SORT: MatterSort = { key: "updatedAt", direction: "desc" };

export interface MattersProviderProps {
  children: React.ReactNode;
  matters: Matter[];
  capabilities?: Partial<MatterCapabilities>;
  initialFilters?: MatterFilters;
  initialSort?: MatterSort;
}

export function MattersProvider({
  children,
  matters: initial,
  capabilities,
  initialFilters = {},
  initialSort = DEFAULT_SORT,
}: MattersProviderProps) {
  const [matters, setMatters] = React.useState(initial);
  const [filters, setFiltersState] = React.useState<MatterFilters>(initialFilters);
  const [sort, setSort] = React.useState<MatterSort>(initialSort);

  React.useEffect(() => setMatters(initial), [initial]);

  const setFilters = React.useCallback((next: Partial<MatterFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
  }, []);

  const resetFilters = React.useCallback(() => setFiltersState({}), []);

  const getMatter = React.useCallback(
    (id: string) => matters.find((m) => m.id === id),
    [matters],
  );

  const updateMatter = React.useCallback((id: string, patch: Partial<Matter>) => {
    setMatters((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const removeMatter = React.useCallback((id: string) => {
    setMatters((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const value = React.useMemo<MattersContextValue>(
    () => ({
      matters,
      filters,
      sort,
      capabilities: { ...DEFAULT_CAPS, ...capabilities },
      setFilters,
      resetFilters,
      setSort,
      getMatter,
      updateMatter,
      removeMatter,
    }),
    [matters, filters, sort, capabilities, setFilters, resetFilters, getMatter, updateMatter, removeMatter],
  );

  return <MattersContext.Provider value={value}>{children}</MattersContext.Provider>;
}

export function useMatters(): MattersContextValue {
  const ctx = React.useContext(MattersContext);
  if (!ctx) throw new Error("useMatters must be used inside <MattersProvider>.");
  return ctx;
}
