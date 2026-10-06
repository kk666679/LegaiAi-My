"use client";
import * as React from "react";
import { trpcReact } from "@/clients";
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

function toLegalDocument(row: Record<string, unknown>): LegalDocument {
  const tags = (row.tags as string[] | undefined | null) ?? [];
  return {
    id: row.id as string,
    name: (row.title as string) ?? "",
    type: (row.docType as string) ?? "OTHER",
    category: undefined,
    status: (row.status as string) as LegalDocument["status"],
    ownerId: row.createdBy as string | undefined,
    ownerName: undefined,
    folderId: null,
    size: (row.fileSize as number | undefined) ?? undefined,
    pageCount: undefined,
    language: undefined,
    jurisdiction: (row.jurisdiction as string | null | undefined) ?? undefined,
    parties: undefined,
    tags: tags.map((t, i) => ({ id: `${row.id as string}-t${i}`, label: t })),
    favorite: false,
    aiStatus: undefined,
    createdAt: (row.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as Date)?.toISOString() ?? new Date().toISOString(),
    thumbnailUrl: undefined,
    url: (row.fileUrl as string | undefined) ?? undefined,
  };
}

function toStats(statsData: unknown): DocumentsStats {
  const s = statsData as { total?: number; byStatus?: Record<string, number>; byType?: Record<string, number> } | undefined;
  return {
    total: s?.total ?? 0,
    ready: s?.byStatus?.draft ?? 0,
    processing: 0,
    review: s?.byStatus?.review ?? 0,
    pendingApproval: 0,
    analysed: s?.byStatus?.approved ?? 0,
    favorites: 0,
  };
}

export function useDocumentsList(options: UseDocumentsListOptions = {}): UseDocumentsListResult {
  const { filters, sort, scope = "all" } = options;
  const pageSize = options.pageSize ?? 25;

  const [documents, setDocuments] = React.useState<LegalDocument[]>([]);
  const [stats, setStats] = React.useState<DocumentsStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  const search = filters?.query?.trim() ?? "";
  const sortBy = sort?.key === "name" ? "title" : (sort?.key ?? "updatedAt") as "createdAt" | "updatedAt" | "title";
  const sortOrder = sort?.direction ?? "desc";

  const { data: listData, isLoading: listLoading, error: listError } = trpcReact.documents.list.useQuery(
    {
      ...(search ? { search } : {}),
      ...(filters?.status?.[0] ? { status: filters.status[0] } : {}),
      ...(filters?.type?.[0] ? { docType: filters.type[0] } : {}),
      limit: pageSize,
      sortBy,
      sortOrder,
    },
    { staleTime: 30_000 },
  );

  const { data: statsData, isLoading: statsLoading } = trpcReact.documents.stats.useQuery(undefined, { staleTime: 30_000 });

  React.useEffect(() => {
    if (listLoading || statsLoading) {
      setLoading(true);
      return;
    }

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const rows = ((listData as { documents?: unknown[] } | undefined)?.documents ?? []) as Record<string, unknown>[];
    const mapped = rows.map(toLegalDocument);
    setDocuments(mapped);
    setStats(statsData ? toStats(statsData) : null);
    setLoading(false);
    setError(undefined);
  }, [listData, listLoading, listError, statsData, statsLoading, tick]);

  return { documents, stats, loading, error, reload };
}
