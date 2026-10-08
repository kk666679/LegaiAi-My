"use client";
// app/lawmate/settings/security/security-client.tsx
import * as React from "react";
import { Laptop, Smartphone, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsField, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

type SessionRecord = { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string | Date; current: boolean };


export function SecuritySettings() {
  const queryClient = trpcReact.useUtils();
  const sessions = trpcReact.auth.sessions.useQuery();
  const changePassword = trpcReact.auth.changePassword.useMutation();
  const revokeSession = trpcReact.auth.revokeSession.useMutation();
  const revokeOthers = trpcReact.auth.revokeOtherSessions.useMutation();
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
    changePassword.mutate({ currentPassword: current, newPassword: next }, {
      onSuccess: () => {
        setCurrent(""); setNext(""); setConfirm("");
        toast.success("Password updated. Other sessions were signed out.");
        void queryClient.auth.sessions.invalidate();
      },
      onError: (error: Error) => toast.error(error.message || "Could not update password"),
    });
  };

  return (
    <SettingsPage
      title="Security"
      description="Protect your account and review recent activity."
      footer={{ onSave, saving: changePassword.isPending, saveLabel: "Update password", disabled: !current || !next || !confirm || !!mismatch || !!weak }}
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
            description="Authenticator setup is not available for this account yet."
            control={<Switch checked={false} disabled aria-label="Authenticator app unavailable" />}
          />
          <SettingsRow
            label="Biometric unlock"
            description="Biometric unlock is not supported in this web app."
            control={<Switch checked={false} disabled aria-label="Biometric unlock unavailable" />}
          />
          <SettingsRow
            label="Login alerts"
            description="Login alert delivery is not configured for this account yet."
            control={<Switch checked={false} disabled aria-label="Login alerts unavailable" />}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Active sessions"
        description="Devices currently signed in to your account."
        action={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => revokeOthers.mutate(undefined, { onSuccess: async () => { await queryClient.auth.sessions.invalidate(); toast.success("Signed out of other sessions"); }, onError: (error: Error) => toast.error(error.message) })} disabled={revokeOthers.isPending}>
            <LogOut className="size-3.5" /> Sign out all other
          </Button>
        }
      >
        <ul className="divide-y divide-border/60">
          {((sessions.data ?? []) as SessionRecord[]).map((s: SessionRecord) => (
            <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                {/mobile|android|iphone/i.test(s.userAgent ?? "") ? <Smartphone className="size-4" /> : <Laptop className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{s.userAgent || "Unknown device"}</p>
                  {s.current ? <Badge variant="secondary" className="text-[10px]">This device</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{s.ipAddress || "Unknown location"} · {new Date(s.createdAt).toLocaleString()}</p>
              </div>
              {!s.current ? (
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={revokeSession.isPending} onClick={() => revokeSession.mutate({ sessionId: s.id }, { onSuccess: async () => { await queryClient.auth.sessions.invalidate(); toast.success("Session revoked"); }, onError: (error: Error) => toast.error(error.message) })}>
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
            onClick={() => toast.error("Account deletion needs a verified email confirmation flow, which is not configured yet.")}
          >
            Delete account
          </Button>
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
