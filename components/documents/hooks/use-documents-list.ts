"use client";
import * as React from "react";
import type {
  DocumentFilters,
  DocumentSort,
  DocumentsStats,
  LegalDocument,
} from "../types";

export interface UseDocumentsListOptions {
  filters?: DocumentFilters;
  sort?: DocumentSort;
  scope?: string;
  pageSize?: number;
}

export interface UseDocumentsListResult {
  documents: LegalDocument[];
  stats: DocumentsStats | null;
  loading: boolean;
  error?: string;
  reload: () => void;
}

export function useDocumentsList(options: UseDocumentsListOptions = {}): UseDocumentsListResult {
  const { filters, sort, scope = "all" } = options;
  const [documents, setDocuments] = React.useState<LegalDocument[]>([]);
  const [stats, setStats] = React.useState<DocumentsStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    // Replace with real fetch:
    // const params = new URLSearchParams();
    // if (filters?.query) params.set("q", filters.query);
    // ...
    // const res = await fetch(`/api/documents?scope=${scope}&${params}`);
    // const json = await res.json();

    const run = async () => {
      try {
        const mock: { documents: LegalDocument[]; stats: DocumentsStats } = {
          documents: [],
          stats: { total: 0, ready: 0, processing: 0, review: 0, pendingApproval: 0, analysed: 0, favorites: 0 },
        };

        let docs = mock.documents;
        // Client-side filter as a placeholder for server-side filtering
        if (filters?.query) {
          const q = filters.query.toLowerCase();
          docs = docs.filter((d) => d.name.toLowerCase().includes(q));
        }
        if (filters?.status?.length) {
          docs = docs.filter((d) => filters.status!.includes(d.status));
        }
        if (filters?.type?.length) {
          docs = docs.filter((d) => filters.type!.includes(d.type));
        }

        // Client-side sort
        if (sort) {
          docs = [...docs].sort((a, b) => {
            const dir = sort.direction === "asc" ? 1 : -1;
            switch (sort.key) {
              case "name": return a.name.localeCompare(b.name) * dir;
              case "type": return a.type.localeCompare(b.type) * dir;
              case "status": return a.status.localeCompare(b.status) * dir;
              case "createdAt": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
              case "updatedAt":
              default:
                return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
            }
          });
        }

        if (!cancelled) {
          setDocuments(docs);
          setStats(mock.stats);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [filters, sort, scope, tick]);

  return { documents, stats, loading, error, reload };
}
