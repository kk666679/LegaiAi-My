"use client";

import { useState } from "react";
import { Shield, Key, LogOut, Info, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SecuritySettingsPage() {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // AuthProvider already cleared the local session.
      window.location.href = "/login";
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account security</CardTitle>
            <CardDescription>
              How your account is protected in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecurityRow
              icon={Shield}
              label="Role-based access control"
              value="Enforced"
              desc="Every API request is authorised server-side against your role."
            />
            <SecurityRow
              icon={Key}
              label="Session duration"
              value="7 days"
              desc="Sessions expire after 7 days of inactivity and are revoked on sign-out."
            />
            <SecurityRow
              icon={Key}
              label="Credential storage"
              value="Bcrypt"
              desc="Passwords are salted and hashed server-side; never stored in plain text."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current session</CardTitle>
            <CardDescription>Sign out of this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-card/30 p-3">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                Signed in as {user?.role ?? "viewer"}
                {user?.org?.name ? ` · ${user.org.name}` : ""}
              </p>
            </div>
            <Button variant="outline" onClick={() => void handleSignOut()} disabled={signingOut}>
              <LogOut className="size-4" />
              {signingOut ? "Signing out…" : "Sign out of this device"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Alert>
          <Info className="size-4" aria-hidden />
          <AlertDescription>
            Password changes, two-factor authentication and session
            management across devices are handled by your organisation
            administrator. If you are locked out, contact them to
            reset your access.
          </AlertDescription>
        </Alert>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" /> Danger zone
            </CardTitle>
            <CardDescription>Irreversible actions for this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => void handleSignOut()} disabled={signingOut}>
              <LogOut className="size-4" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}

function SecurityRow({
  icon: Icon,
  label,
  value,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {value}
      </Badge>
    </div>
  );
}
