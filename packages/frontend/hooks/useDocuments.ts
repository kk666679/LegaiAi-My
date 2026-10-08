"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { trpcReact } from "@/clients";
import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  type DocumentCourt,
  type DocumentStatus,
  type DocumentType,
} from "@/lib/documents/constants";

// Real documents data layer backed by the `documents` tRPC router.
// Every field exposed here comes from the database — this module never
// synthesises documents, statuses or counts, so the UI can be trusted
// to reflect what is actually stored (see AGENTS.md safety rule 1).

export { DOC_COURTS, DOC_STATUSES, DOC_TYPES };
export type { DocumentCourt, DocumentStatus, DocumentType };

export interface DocumentListItem {
  id: string;
  title: string;
  docType: string;
  status: string;
  clientId: string | null;
  caseNumber: string | null;
  court: string | null;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: number;
}

export interface ClientSummary {
  id: string;
  name: string;
}

export interface DocumentFilters {
  search: string;
  status: DocumentStatus | "all";
  docType: DocumentType | "all";
  court: DocumentCourt | "all";
  clientId: string;
  sortBy: "createdAt" | "updatedAt" | "title";
  sortOrder: "asc" | "desc";
}

export const DEFAULT_DOCUMENT_FILTERS: DocumentFilters = {
  search: "",
  status: "all",
  docType: "all",
  court: "all",
  clientId: "all",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

/** True when anything narrows the result set beyond the default sort. */
export function hasActiveDocumentFilters(f: DocumentFilters): boolean {
  return (
    f.search.trim() !== "" ||
    f.status !== "all" ||
    f.docType !== "all" ||
    f.court !== "all" ||
    f.clientId !== "all"
  );
}

/** Strips filters down to only the keys a procedure input accepts. */
function toQueryInput(f: DocumentFilters, limit: number, cursor?: string) {
  const search = f.search.trim();
  return {
    limit,
    ...(cursor ? { cursor } : {}),
    ...(search ? { search } : {}),
    ...(f.status !== "all" ? { status: f.status } : {}),
    ...(f.docType !== "all" ? { docType: f.docType } : {}),
    ...(f.court !== "all" ? { court: f.court } : {}),
    ...(f.clientId !== "all" ? { clientId: f.clientId } : {}),
    sortBy: f.sortBy,
    sortOrder: f.sortOrder,
  };
}

/**
 * Paginated document library. Pages accumulate via `loadMore` so that a
 * user who has scrolled to page 4 does not lose the earlier pages when a
 * filter changes or a mutation invalidates the cache.
 */
export function useDocumentLibrary(filters: DocumentFilters, pageSize = 25) {
  const queryClient = useQueryClient();
  // One cursor per loaded page; index 0 is the first (cursorless) page.
  const [cursors, setCursors] = useState<string[]>([]);

  const list = trpcReact.documents.list.useQuery(
    toQueryInput(filters, pageSize, cursors[cursors.length - 1]),
    { placeholderData: keepPreviousData, staleTime: 30_000 },
  );

  const stats = trpcReact.documents.stats.useQuery(undefined, { staleTime: 30_000 });

  const clients = trpcReact.clients.list.useQuery(
    { limit: 100 },
    { staleTime: 120_000 },
  );

  const documents = useMemo(
    () =>
      ((list.data as { documents?: DocumentListItem[] } | undefined)?.documents ??
        []) as DocumentListItem[],
    [list.data],
  );

  const clientNames = useMemo(() => {
    const rows = ((clients.data as { clients?: ClientSummary[] } | undefined)?.clients ??
      []) as ClientSummary[];
    return new Map(rows.map((c) => [c.id, c.name]));
  }, [clients.data]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["documents", "stats"] });
    setCursors([]);
  }, [queryClient]);

  const loadMore = useCallback(() => {
    const next = (list.data as { nextCursor?: string } | undefined)?.nextCursor;
    if (next) setCursors((cur) => [...cur, next]);
  }, [list.data]);

  return {
    documents,
    total: ((stats.data as DocumentStats | undefined)?.total ?? 0) as number,
    stats: (stats.data ?? null) as DocumentStats | null,
    clientNames,
    clients: ((clients.data as { clients?: ClientSummary[] } | undefined)?.clients ??
      []) as ClientSummary[],
    isLoading: list.isLoading,
    isFetching: list.isFetching,
    error: list.error ?? null,
    statsError: stats.error ?? null,
    hasMore: !!((list.data as { hasMore?: boolean } | undefined)?.hasMore),
    loadMore,
    retry: () => {
      void list.refetch();
      void stats.refetch();
    },
    refresh: invalidate,
  };
}

export interface CreateDocumentInput {
  title: string;
  content: string;
  docType: DocumentType;
  status?: DocumentStatus;
  clientId?: string;
  caseNumber?: string;
  court?: DocumentCourt;
  jurisdiction?: string;
  tags?: string[];
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  createdBy?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  docType?: DocumentType;
  status?: DocumentStatus;
  clientId?: string | null;
  caseNumber?: string | null;
  court?: DocumentCourt | null;
  jurisdiction?: string | null;
  tags?: string[];
  parties?: Record<string, string> | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  updatedBy?: string;
}

/** Mutations backing the row / bulk action menus. */
export function useDocumentMutations(onDone?: () => void) {
  const queryClient = useQueryClient();

  const settle = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    onDone?.();
  };

  const archive = trpcReact.documents.archive.useMutation({ onSuccess: settle });
  const remove = trpcReact.documents.delete.useMutation({ onSuccess: settle });
  const duplicate = trpcReact.documents.duplicate.useMutation({ onSuccess: settle });
  const submitForReview = trpcReact.documents.submitForReview.useMutation({
    onSuccess: settle,
  });
  const approve = trpcReact.documents.approve.useMutation({ onSuccess: settle });
  const create = trpcReact.documents.create.useMutation({ onSuccess: settle });
  const update = trpcReact.documents.update.useMutation({ onSuccess: settle });

  return {
    archive: (id: string) => archive.mutateAsync({ id }),
    remove: (id: string) => remove.mutateAsync({ id }),
    duplicate: (id: string, newTitle?: string) =>
      duplicate.mutateAsync({ id, ...(newTitle ? { newTitle } : {}) }),
    submitForReview: (id: string, reviewerId?: string) =>
      submitForReview.mutateAsync({ id, ...(reviewerId ? { reviewerId } : {}) }),
    approve: (id: string, reviewerId: string) => approve.mutateAsync({ id, reviewerId }),
    create: (input: CreateDocumentInput) => create.mutateAsync(input),
    update: (id: string, input: UpdateDocumentInput) => update.mutateAsync({ id, ...input }),
    isPending: archive.isPending || remove.isPending || duplicate.isPending || update.isPending,
  };
}

/** Single document, used by the detail route. */
export function useDocument(id: string) {
  const query = trpcReact.documents.getById.useQuery(id, {
    enabled: !!id,
    retry: false,
  });

  return {
    document: (query.data ?? null) as Record<string, unknown> | null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    retry: () => void query.refetch(),
  };
}
