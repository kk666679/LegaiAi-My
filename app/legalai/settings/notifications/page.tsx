"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotificationSettingsPage() {
  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>
            Alerts for deadlines, AI completions and security events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Bell}
            title="Notification preferences"
            description="Workspace alerts (deadlines, critical alerts, AI completions) are surfaced in the notification centre. Per-channel email and push preferences are managed by your organisation administrator."
            action="Open notification centre"
            actionHref="/legalai/notifications"
          />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/legalai/notifications">View notifications</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
