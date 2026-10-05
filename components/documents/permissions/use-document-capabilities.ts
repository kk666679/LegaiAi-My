"use client";

import { usePermission } from "@/components/shared/PermissionGate";
import { useAuth } from "@/components/auth-provider";
import type {
  DocumentCapabilities,
  DocumentLifecycleStatus,
  DocumentShareRole,
} from "../types";

/**
 * Document capability gating (§43).
 *
 * Maps the app's real role→permission table (`lib/permissions`, mirrored from
 * the backend) onto the capability vocabulary the Documents UI gates on.
 *
 * Frontend gating is a **UX boundary only** — the backend re-authorizes every
 * request (`permissionProcedure`). Hiding a button is not enforcement; it just
 * avoids offering an action that is guaranteed to fail.
 *
 * "Can view" is intentionally always true: a document the user can reach in
 * the UI has already passed tenant/permission checks server-side. We never
 * render an empty shell for an unreadable document, because the correct
 * response there is a route-level 404, not a blank workspace.
 */
export function useDocumentCapabilities(): DocumentCapabilities {
  const canEdit = usePermission("edit_document");
  const canDelete = usePermission("delete_document");
  const canApprove = usePermission("approve_agent_action");
  const canShare = usePermission("edit_document");
  const canExport = usePermission("view_drafts");

  return {
    canView: true,
    canEdit,
    // Comments and sharing ride the edit permission — there is no separate
    // backend grant for them, so inventing one would imply access we don't have.
    canComment: canEdit,
    canShare,
    canExport,
    canDelete,
    canApprove,
  };
}

/**
 * Capabilities for a *specific* document, narrowed by its lifecycle status.
 *
 * Status gates mirror the `documents` router's own preconditions: only drafts
 * can be submitted for review, only documents under review can be approved, and
 * approved documents can be archived but not deleted (§18).
 */
export function useDocumentActions(
  status: DocumentLifecycleStatus,
): DocumentCapabilities {
  const base = useDocumentCapabilities();

  return {
    ...base,
    // Archiving/approving are mutations of a live document, not free text edits.
    canApprove: base.canApprove && status === "review",
    // The router rejects deletes for approved documents, so don't offer one.
    canDelete: base.canDelete && status !== "approved" && status !== "final",
    canEdit: base.canEdit && status !== "archived",
  };
}

/** The effective share role for a document, derived from real capabilities. */
export function useDocumentRole(
  capabilities: DocumentCapabilities,
): DocumentShareRole {
  if (capabilities.canEdit && capabilities.canApprove) return "owner";
  if (capabilities.canEdit) return "editor";
  if (capabilities.canComment) return "reviewer";
  return "viewer";
}

/** Stable display identity for the signed-in user, when the auth provider has one. */
export function useDocumentViewer() {
  const { user } = useAuth();
  return {
    id: user?.id ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    /** Reviewer actions require an actual user id to attribute the approval. */
    canAttributeApproval: !!user?.id,
  };
}