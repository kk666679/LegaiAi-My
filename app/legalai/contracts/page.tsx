"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Plus,
  FileText,
  FileSignature,
  Sparkles,
  Clock,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  ArrowRight,
  Bot,
  Scale,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { DocumentsNav } from "@/components/documents/DocumentsNav";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_DOCUMENT_FILTERS,
  useDocumentLibrary,
  type DocumentFilters,
} from "@/hooks/useDocuments";
import { useDebounce } from "@/hooks/useDebounce";
import { relativeTime } from "@/lib/lawmate/utils";

/**
 * Contracts workspace (Documents §9).
 *
 * Backed by the real `documents` table through `useDocumentLibrary` — every
 * figure rendered here comes from the database. Nothing is synthesised: there
 * is no mock list and no invented risk score (AGENTS.md safety rule 1 — never
 * fabricate). Contract insight is produced by the analysis engine when the
 * contract is actually opened on the contract detail workspace.
 */

const ALL = "all";

/**
 * Contract statuses mirror the document library lifecycle (`useDocuments` →
 * DOC_STATUSES) so a contract reads identically in the Documents library and
 * here. Colour is never the only signal — `StatusBadge` always renders a label.
 */
const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
] as const;

const SORT_OPTIONS = [
  { value: "updatedAt-desc", label: "Recently modified" },
  { value: "updatedAt-asc", label: "Least recently modified" },
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function parseSort(value: string): Pick<DocumentFilters, "sortBy" | "sortOrder"> {
  const [sortBy, sortOrder] = value.split("-") as [
    DocumentFilters["sortBy"],
    DocumentFilters["sortOrder"],
  ];
  return { sortBy, sortOrder };
}
