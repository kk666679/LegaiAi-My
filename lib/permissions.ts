// Frontend authorization helpers. These mirror the backend role →
// permission map in backend/src/lib/auth.ts and are used purely as a
// UX boundary — the backend remains authoritative and every mutation
// is still enforced server-side via permissionProcedure().

export const ROLES = ["admin", "lawyer", "paralegal", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  create_case: ["admin", "lawyer"],
  edit_document: ["admin", "lawyer", "paralegal"],
  delete_document: ["admin"],
  view_audit_log: ["admin", "lawyer"],
  manage_users: ["admin"],
  run_agents: ["admin", "lawyer", "paralegal"],
  view_drafts: ["admin", "lawyer", "paralegal", "viewer"],
  approve_agent_action: ["admin", "lawyer"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function hasRole(role: string | null | undefined, allowed: readonly Role[]): boolean {
  if (!role) return false;
  return (allowed as readonly string[]).includes(role);
}

/** Roles that can administer the workspace (mirror of adminProcedure). */
export const ADMIN_ROLES: readonly Role[] = ["admin"];
