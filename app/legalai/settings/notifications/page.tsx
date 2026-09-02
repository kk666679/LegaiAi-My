"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function NotificationSettingsPage() {
  const [emailAI, setEmailAI] = useState(true);
  const [emailTasks, setEmailTasks] = useState(true);
  const [emailMentions, setEmailMentions] = useState(true);
  const [emailWeekly, setEmailWeekly] = useState(false);
  const [pushJobs, setPushJobs] = useState(true);
  const [pushTasks, setPushTasks] = useState(false);
  const [pushSecurity, setPushSecurity] = useState(true);

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4 text-primary" /> Email notifications
          </CardTitle>
          <CardDescription>Choose what we email you about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PrefRow label="AI job completions" desc="Citation validation, analyses, drafts." icon={Bell} checked={emailAI} onChange={setEmailAI} />
          <PrefRow label="Task assignments" desc="When you're assigned a task." icon={Bell} checked={emailTasks} onChange={setEmailTasks} />
          <PrefRow label="Mentions" desc="When someone @mentions you." icon={MessageSquare} checked={emailMentions} onChange={setEmailMentions} />
          <PrefRow label="Weekly digest" desc="Summary of your week's activity." icon={Mail} checked={emailWeekly} onChange={setEmailWeekly} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="size-4 text-primary" /> Push notifications
          </CardTitle>
          <CardDescription>Real-time alerts on your devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PrefRow label="AI jobs" desc="Push when AI jobs complete." icon={Bell} checked={pushJobs} onChange={setPushJobs} />
          <PrefRow label="Tasks" desc="Push for task assignments and deadlines." icon={Bell} checked={pushTasks} onChange={setPushTasks} />
          <PrefRow label="Security" desc="Always notify for security events." icon={Bell} checked={pushSecurity} onChange={setPushSecurity} />
        </CardContent>
      </Card>
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
