"use client";

import { User as UserIcon, Mail, Shield, Scale, Calendar, Info } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function ProfileSettingsPage() {
  const { user } = useAuth();

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            How you appear to your team. Profile changes are managed by your
            organisation administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {initials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.name ?? user?.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
              <Badge variant="outline" className="mt-1 gap-1 text-[10px] capitalize">
                <Shield className="size-3" aria-hidden />
                {user?.role ?? "viewer"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField icon={UserIcon} label="Full name" value={user?.name ?? "Not set"} />
            <ProfileField icon={Mail} label="Email" value={user?.email ?? "—"} />
            <ProfileField icon={Scale} label="Organisation" value={user?.org?.name ?? "Personal workspace"} />
            <ProfileField icon={Shield} label="Role" value={<span className="capitalize">{user?.role ?? "viewer"}</span>} />
          </div>

          <Separator />

          <Alert>
            <Info className="size-4" aria-hidden />
            <AlertDescription>
              To update your name, email or role, contact your workspace
              administrator. Changes to identity fields are audited.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card/30 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
