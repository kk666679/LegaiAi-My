// components/hitl/core/hitl-context.tsx
"use client";

import * as React from "react";
import type { HITLActor, HITLFilters, HITLRequest, HITLSort } from "../types";

export interface HITLContextValue {
  requests: HITLRequest[];
  currentUser: HITLActor;
  filters: HITLFilters;
  sort: HITLSort;
}

const HITLContext = React.createContext<HITLContextValue | null>(null);

export interface HITLProviderProps {
  requests?: HITLRequest[];
  currentUser?: HITLActor;
  initialFilters?: HITLFilters;
  initialSort?: HITLSort;
  children: React.ReactNode;
}

export function HITLProvider({
  requests = [],
  currentUser,
  initialFilters,
  initialSort,
  children,
}: HITLProviderProps) {
  const value: HITLContextValue = {
    requests,
    currentUser: currentUser ?? { id: "unknown", name: "Unknown" },
    filters: initialFilters ?? {},
    sort: initialSort ?? { key: "createdAt", direction: "desc" },
  };
  return <HITLContext.Provider value={value}>{children}</HITLContext.Provider>;
}

export function useHITL(): HITLContextValue {
  const ctx = React.useContext(HITLContext);
  if (!ctx) {
    throw new Error("useHITL must be used within an HITLProvider");
  }
  return ctx;
}
