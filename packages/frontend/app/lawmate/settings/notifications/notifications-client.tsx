"use client";
// app/lawmate/settings/notifications/notifications-client.tsx
import * as React from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";

export function NotificationSettings() {
  const [channels, setChannels] = React.useState({
    email: true,
    inApp: true,
    slack: false,
    digest: true,
  });

  const [events, setEvents] = React.useState({
    matterAssigned: true,
    deadlineTomorrow: true,
    slaBreach: true,
    hitlAssigned: true,
    hitlDecided: true,
    documentShared: true,
    contractRenewal: true,
    aiComplete: false,
    teamMention: true,
    billingFailed: true,
  });

  const [digest, setDigest] = React.useState("weekly");
  const [quiet, setQuiet] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const toggle = <T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    key: keyof T,
  ) => (v: boolean) =>
    setter((s) => ({ ...s, [key]: v }));

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Notification preferences saved");
    }, 500);
  };

  return (
    <SettingsPage
      title="Notifications"
      description="Choose where and when LegAI reaches out to you."
      footer={{ onSave, saving }}
    >
      <SettingsSection title="Channels" description="How would you like to receive notifications?">
        <div className="space-y-3">
          <SettingsRow
            label="Email"
            description="Sent to your profile email address."
            control={<Switch checked={channels.email} onCheckedChange={toggle(setChannels, "email")} />}
          />
          <SettingsRow
            label="In-app"
            description="Shown in the notifications bell inside LegAI."
            control={<Switch checked={channels.inApp} onCheckedChange={toggle(setChannels, "inApp")} />}
          />
          <SettingsRow
            label="Slack"
            description="Direct messages for time-sensitive items."
            control={<Switch checked={channels.slack} onCheckedChange={toggle(setChannels, "slack")} />}
          />
          <SettingsRow
            label="Digest email"
            description="A summary of activity, sent on a schedule."
            control={<Switch checked={channels.digest} onCheckedChange={toggle(setChannels, "digest")} />}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Digest schedule"
        description="When to send the summary email."
        action={
          <Select value={digest} onValueChange={setDigest} disabled={!channels.digest}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (8 AM)</SelectItem>
              <SelectItem value="weekly">Weekly (Mon 8 AM)</SelectItem>
              <SelectItem value="monthly">Monthly (1st 8 AM)</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <p className="text-xs text-muted-foreground">
          Digest includes matters updated, deadlines approaching, review queue items decided, and
          weekly AI usage.
        </p>
      </SettingsSection>

      <SettingsSection title="Events" description="Toggle which events notify you.">
        <div className="space-y-3">
          <SettingsRow
            label="Matter assigned to me"
            description="When a matter or task is assigned to you."
            control={<Switch checked={events.matterAssigned} onCheckedChange={toggle(setEvents, "matterAssigned")} />}
          />
          <SettingsRow
            label="Deadline tomorrow"
            description="24 hours before a deadline on your matters."
            control={<Switch checked={events.deadlineTomorrow} onCheckedChange={toggle(setEvents, "deadlineTomorrow")} />}
          />
          <SettingsRow
            label="SLA breach"
            description="When a review item breaches its SLA."
            control={<Switch checked={events.slaBreach} onCheckedChange={toggle(setEvents, "slaBreach")} />}
          />
          <SettingsRow
            label="Review queue item assigned"
            description="When a HITL review item is routed to you."
            control={<Switch checked={events.hitlAssigned} onCheckedChange={toggle(setEvents, "hitlAssigned")} />}
          />
          <SettingsRow
            label="Review queue decision"
            description="When an item you requested is decided."
            control={<Switch checked={events.hitlDecided} onCheckedChange={toggle(setEvents, "hitlDecided")} />}
          />
          <SettingsRow
            label="Document shared with me"
            description="When a document is shared or @-mentioned."
            control={<Switch checked={events.documentShared} onCheckedChange={toggle(setEvents, "documentShared")} />}
          />
          <SettingsRow
            label="Contract renewal approaching"
            description="30, 14, and 7 days before renewal or expiry."
            control={<Switch checked={events.contractRenewal} onCheckedChange={toggle(setEvents, "contractRenewal")} />}
          />
          <SettingsRow
            label="AI action completed"
            description="When a long-running AI job finishes."
            control={<Switch checked={events.aiComplete} onCheckedChange={toggle(setEvents, "aiComplete")} />}
          />
          <SettingsRow
            label="Team mention"
            description="When you're mentioned in a comment or note."
            control={<Switch checked={events.teamMention} onCheckedChange={toggle(setEvents, "teamMention")} />}
          />
          <SettingsRow
            label="Billing failures"
            description="When a payment or invoice fails."
            control={<Switch checked={events.billingFailed} onCheckedChange={toggle(setEvents, "billingFailed")} />}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Quiet hours" description="Mute non-urgent notifications during this window.">
        <div className="space-y-3">
          <SettingsRow
            label="Enable quiet hours"
            description="Urgent and SLA-breach notifications still arrive."
            control={<Switch checked={quiet} onCheckedChange={setQuiet} />}
          />
          {quiet ? (
            <p className="text-xs text-muted-foreground">
              Default: 20:00 – 07:00 in your local timezone. Adjust in{" "}
              <a href="/lawmate/settings/profile" className="text-primary hover:underline">
                Profile → Regional
              </a>
              .
            </p>
          ) : null}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
