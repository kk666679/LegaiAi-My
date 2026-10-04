"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Shield,
  Loader2,
  CheckCircle2,
  Mail,
  Calendar,
} from "lucide-react";
import { trpcReact } from "@/clients";
import { useAuth } from "@/components/auth-provider";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { AdminGate } from "@/components/shared/PermissionGate";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = ["admin", "lawyer", "paralegal", "viewer"] as const;

const ROLE_DESCRIPTION: Record<string, string> = {
  admin: "Full access — users, providers, audit trail",
  lawyer: "Create matters, run agents, approve AI actions",
  paralegal: "Edit documents, run agents",
  viewer: "Read-only access to drafts and documents",
};

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export default function UsersSettingsPage() {
  const { user } = useAuth();
  const usersQuery = trpcReact.auth.listUsers.useQuery({ limit: 50 }, {
    staleTime: 30_000,
  });
  const setRole = trpcReact.auth.setRole.useMutation();
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const users = (usersQuery.data ?? []) as Array<{
    id: string;
    email: string;
    name?: string | null;
    role: string;
    lastLoginAt?: string | null;
    createdAt?: string;
  }>;

  const onRoleChange = async (userId: string, role: string) => {
    setPendingRoleId(userId);
    try {
      await setRole.mutateAsync({ userId, role });
      toast.success("Role updated");
      void usersQuery.refetch();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message.slice(0, 160) : "Could not update the role.",
      );
    } finally {
      setPendingRoleId(null);
    }
  };

  return (
    <AdminGate
      fallback={
        <SettingsLayout>
          <EmptyState
            icon={Shield}
            title="Administrator access required"
            description="Only administrators can view and manage team members and roles."
          />
        </SettingsLayout>
      }
    >
      <SettingsLayout>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Team members</CardTitle>
                  <CardDescription>
                    Users in your organisation. Roles are enforced by the
                    backend on every request.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {users.length} member{users.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : users.length === 0 ? (
                <EmptyState
                  icon={UsersIcon}
                  title="No team members"
                  description="Users who sign up with an invite to this organisation appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Last sign-in</TableHead>
                        <TableHead className="text-right">Role actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const isSelf = u.id === user?.id;
                        return (
                          <TableRow key={u.id} className={cn(isSelf && "bg-primary/5")}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="size-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {initials(u.name, u.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {u.name ?? u.email}
                                    {isSelf && (
                                      <span className="ml-2 text-[10px] text-muted-foreground">
                                        (you)
                                      </span>
                                    )}
                                  </p>
                                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                    <Mail className="size-3" aria-hidden />
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant={
                                  u.role === "admin" ? "default" : "secondary"
                                }
                                className="gap-1 text-[10px]"
                              >
                                <Shield className="size-3" aria-hidden />
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="size-3" aria-hidden />
                                {u.lastLoginAt
                                  ? new Date(u.lastLoginAt).toLocaleDateString("en-MY")
                                  : "Never"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={u.role}
                                onValueChange={(v) => void onRoleChange(u.id, v)}
                                disabled={isSelf || pendingRoleId === u.id}
                              >
                                <SelectTrigger className="ml-auto w-32 text-xs">
                                  {pendingRoleId === u.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      <span className="flex flex-col">
                                        <span className="font-medium capitalize">{role}</span>
                                        <span className="text-[10px] font-normal text-muted-foreground">
                                          {ROLE_DESCRIPTION[role]}
                                        </span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role reference</CardTitle>
              <CardDescription>What each role can do in this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ROLE_OPTIONS.map((role) => (
                  <div
                    key={role}
                    className="rounded-md border bg-card/30 p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
                      <p className="text-sm font-medium capitalize">{role}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ROLE_DESCRIPTION[role]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    </AdminGate>
  );
}
