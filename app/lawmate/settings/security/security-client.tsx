"use client";
// app/lawmate/settings/security/security-client.tsx
import * as React from "react";
import { Laptop, Smartphone, LogOut, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsField, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  kind: "desktop" | "mobile";
  location: string;
  lastActive: string;
  current?: boolean;
}

const SESSIONS: Session[] = [
  { id: "s1", device: "MacBook Pro · Safari", kind: "desktop", location: "Kuala Lumpur, MY", lastActive: "Active now", current: true },
  { id: "s2", device: "iPhone 15 · LegAI app", kind: "mobile", location: "Kuala Lumpur, MY", lastActive: "2 hours ago" },
  { id: "s3", device: "Windows · Chrome", kind: "desktop", location: "Singapore, SG", lastActive: "Yesterday" },
];

export function SecuritySettings() {
  const [twoFA, setTwoFA] = React.useState(true);
  const [biometric, setBiometric] = React.useState(false);
  const [loginAlerts, setLoginAlerts] = React.useState(true);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const mismatch = next && confirm && next !== confirm;
  const weak = next.length > 0 && next.length < 12;

  const onSave = () => {
    if (mismatch || weak) {
      toast.error("Fix password errors first");
      return;
    }
    toast.error("Password updates are not available: the account service has no password-change endpoint.");
  };

  return (
    <SettingsPage
      title="Security"
      description="Protect your account and review recent activity."
      footer={{ onSave, saving: false, saveLabel: "Update password", disabled: !current || !next || !confirm }}
    >
      <SettingsSection
        title="Password"
        description="Use at least 12 characters with a mix of letters, numbers, and symbols."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SettingsField label="Current password" required htmlFor="pw-current">
            <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </SettingsField>
          <SettingsField
            label="New password"
            required
            htmlFor="pw-new"
            error={weak ? "Password must be at least 12 characters." : undefined}
          >
            <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </SettingsField>
          <SettingsField
            label="Confirm password"
            required
            htmlFor="pw-confirm"
            error={mismatch ? "Passwords don't match." : undefined}
          >
            <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </SettingsField>
        </div>
        {next ? (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength</span>
              <span className="tabular-nums">{weak ? "Weak" : next.length < 16 ? "Good" : "Strong"}</span>
            </div>
            <Progress
              value={Math.min(100, (next.length / 16) * 100)}
              className="h-1.5"
            />
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection title="Two-factor authentication" description="Add an extra layer of protection at sign-in.">
        <div className="space-y-3">
          <SettingsRow
            label="Authenticator app"
            description={twoFA ? "Enabled with an authenticator app." : "Disabled — enable for stronger security."}
            control={<Switch checked={twoFA} onCheckedChange={setTwoFA} />}
          />
          <SettingsRow
            label="Biometric unlock"
            description="Use Touch ID or Face ID on supported devices."
            control={<Switch checked={biometric} onCheckedChange={setBiometric} />}
          />
          <SettingsRow
            label="Login alerts"
            description="Notify me when a new device signs in."
            control={<Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />}
          />
        </div>
        {twoFA ? (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            Your account is well protected.
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title="Active sessions"
        description="Devices currently signed in to your account."
        action={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.error("Session revocation is not available: the account service does not expose session management.")}>
            <LogOut className="size-3.5" /> Sign out all other
          </Button>
        }
      >
        <ul className="divide-y divide-border/60">
          {SESSIONS.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                {s.kind === "mobile" ? <Smartphone className="size-4" /> : <Laptop className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{s.device}</p>
                  {s.current ? <Badge variant="secondary" className="text-[10px]">This device</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</p>
              </div>
              {!s.current ? (
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => toast.error("Session revocation is not available: the account service does not expose session management.")}>
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title="Danger zone" description="Irreversible actions for your account.">
        <Card className="flex flex-wrap items-center justify-between gap-3 border-destructive/40 bg-destructive/5 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive hover:text-destructive"
            onClick={() => toast.error("Account deletion requires email confirmation")}
          >
            Delete account
          </Button>
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
