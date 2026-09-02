"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, Lock, Key, Smartphone, AlertTriangle, Save } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SecuritySettingsPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [sessions, setSessions] = useState([
    { id: "s-1", device: "MacBook Pro · Chrome 128", location: "Kuala Lumpur, MY", current: true },
    { id: "s-2", device: "iPhone 15 · Safari", location: "Kuala Lumpur, MY", current: false },
    { id: "s-3", device: "iPad · LawMate App", location: "Kuala Lumpur, MY", current: false },
  ]);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const updatePassword = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("All password fields are required");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("New passwords do not match");
      return;
    }
    toast.success("Password updated");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const revokeSession = (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    toast.success("Session revoked");
  };

  const signOutAll = () => {
    setSessions((s) => s.filter((x) => x.current));
    toast.warning("Signed out of all other devices", {
      description: "Your current session remains active.",
    });
  };

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Current password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">New password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Confirm new password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button className="gap-2" onClick={updatePassword}>
                <Save className="size-4" /> Update password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Two-factor authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PrefRow
              label="Enable 2FA"
              desc="Require a second factor (authenticator app) at sign-in."
              icon={Smartphone}
              checked={twoFA}
              onChange={setTwoFA}
            />
            <PrefRow
              label="Auto sign-out after 30 minutes"
              desc="Require re-authentication after idle period."
              icon={Lock}
              checked={sessionTimeout}
              onChange={setSessionTimeout}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                device={s.device}
                location={s.location}
                current={s.current}
                onRevoke={() => revokeSession(s.id)}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base text-red-500 flex items-center gap-2">
              <AlertTriangle className="size-4" /> Danger zone
            </CardTitle>
            <CardDescription>Irreversible actions for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOutAll}>
              Sign out of all devices
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}

function PrefRow({ label, desc, icon: Icon, checked, onChange }: { label: string; desc: string; icon: any; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SessionRow({
  device,
  location,
  current,
  onRevoke,
}: {
  device: string;
  location: string;
  current?: boolean;
  onRevoke?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-muted">
        <Key className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{device}</p>
        <p className="text-xs text-muted-foreground">{location}</p>
      </div>
      {current && <span className="text-[10px] text-emerald-500 font-medium">Current</span>}
      {!current && (
        <Button variant="ghost" size="sm" onClick={onRevoke}>
          Revoke
        </Button>
      )}
    </div>
  );
}
