"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  hasPermission,
  hasRole,
  type Permission,
  type Role,
} from "@/lib/permissions";

/**
 * PermissionGate renders children only when the current user's
 * role grants the given permission. Frontend gating is a UX
 * boundary only — the backend re-authorizes every request.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  if (!hasPermission(user?.role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}

/** RoleGate renders children only for the listed roles. */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: readonly Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  if (!hasRole(user?.role, roles)) return <>{fallback}</>;
  return <>{children}</>;
}

/** AdminGate — convenience wrapper for admin-only UI. */
export function AdminGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate roles={["admin"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/** Can — render-prop style authorization check. */
export function Can({
  permission,
  children,
}: {
  permission: Permission;
  children: (allowed: boolean) => ReactNode;
}) {
  const { user } = useAuth();
  return <>{children(hasPermission(user?.role, permission))}</>;
}

export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
}

export function useRole(): Role | null {
  const { user } = useAuth();
  return (user?.role as Role | undefined) ?? null;
}
