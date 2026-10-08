"use client";
// app/legalai/settings/users/users-client.tsx
import * as React from "react";
import { MoreHorizontal, Plus, Search, Shield, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection } from "../_components/settings-section";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpcReact } from "@/clients";
import { useAuth } from "@/components/auth-provider";

type Role = "admin" | "lawyer" | "paralegal" | "viewer";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  lawyer: "Lawyer",
  paralegal: "Paralegal",
  viewer: "Viewer",
};

const ROLE_TONE: Record<Role, string> = {
  admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  lawyer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paralegal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  viewer: "bg-muted text-muted-foreground",
};

export function UsersSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: backendUsers = [], isLoading, refetch } = trpcReact.auth.listUsers.useQuery(
    { limit: 50 },
    { enabled: isAdmin, staleTime: 10_000 },
  );
  const setRole = trpcReact.auth.setRole.useMutation();
  const utils = trpcReact.useUtils();

  const [query, setQuery] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<Role>("lawyer");

  const members = (backendUsers as any[]).map((u) => ({
    id: u.id,
    name: u.name ?? u.email.split("@")[0],
    email: u.email,
    role: u.role as Role,
    status: u.lastLoginAt ? "active" : "invited" as const,
    lastActive: u.lastLoginAt ? `${Math.round((Date.now() - new Date(u.lastLoginAt).getTime()) / 60000)}m ago` : "Never",
    avatarUrl: u.avatarUrl ?? null,
  }));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.name} ${m.email}`.toLowerCase().includes(q),
    );
  }, [members, query]);

  const onChangeRole = async (userId: string, role: Role) => {
    try {
      await setRole.mutateAsync({ userId, role });
      await utils.auth.listUsers.invalidate();
      toast.success(`Role changed to ${ROLE_LABEL[role]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  const onInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    // Invitations require an email service — not yet wired to backend.
    toast.info("Invitations are not yet supported by the backend. The user must sign up manually.");
    setInviteEmail("");
    setInviteOpen(false);
  };

  return (
    <SettingsPage
      title="Team"
      description="Manage members, roles, and access to your workspace."
      actions={
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="size-3.5" /> Invite member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                They&apos;ll receive an email with a link to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — full access</SelectItem>
                    <SelectItem value="lawyer">Lawyer — create and edit</SelectItem>
                    <SelectItem value="paralegal">Paralegal — edit assigned matters</SelectItem>
                    <SelectItem value="viewer">Viewer — read only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onInvite} className="gap-1.5">
                <Plus className="size-3.5" /> Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <SettingsSection
        title="Members"
        description={`${members.length} people have access to this workspace.`}
        action={
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              className="h-8 pl-8 text-xs"
              aria-label="Search members"
            />
          </div>
        }
      >
        {!isAdmin && isLoading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Loading members…</p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {members.length === 0 ? "No members yet" : `No members match "${query}".`}
          </p>
        ) : (
        <ul className="divide-y divide-border/60">
          {filtered.map((m) => {
            const initials = m.name
              .split(" ")
              .map((s: string) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="size-9">
                  {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <Badge
                      variant="outline"
                      className={cn("border-transparent text-[10px] font-medium", ROLE_TONE[m.role])}
                    >
                      {ROLE_LABEL[m.role]}
                    </Badge>
                    {m.status === "invited" ? (
                      <Badge variant="outline" className="text-[10px]">Invited</Badge>
                    ) : null}
                    {m.status === "suspended" ? (
                      <Badge variant="outline" className="text-[10px] text-destructive">Suspended</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.lastActive ? ` · ${m.lastActive}` : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground"
                      aria-label={`Actions for ${m.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Change role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(["admin", "lawyer", "paralegal", "viewer"] as Role[]).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        disabled={m.role === role}
                        onSelect={() => void onChangeRole(m.id, role)}
                      >
                        {ROLE_LABEL[role]}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={true}
                    >
                      Remove from workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
        )}
      </SettingsSection>

      <SettingsSection title="Roles" description="What each role can do in your workspace.">
        {!isAdmin && (
          <p className="text-sm text-muted-foreground py-2">Only workspace admins can manage members.</p>
        )}
        <div className="space-y-2">
          {(
            [
              { role: "admin", desc: "Manage members, settings, and all matters and documents." },
              { role: "lawyer", desc: "Create and edit matters, documents, and contracts." },
              { role: "paralegal", desc: "Edit assigned matters and prepare drafts." },
              { role: "viewer", desc: "Read-only access to assigned matters." },
            ] as Array<{ role: Role; desc: string }>
          ).map((r) => (
            <div key={r.role} className="flex items-start gap-3 py-1.5">
              <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{ROLE_LABEL[r.role]}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
