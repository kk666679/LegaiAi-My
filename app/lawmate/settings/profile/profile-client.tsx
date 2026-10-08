"use client";
// app/lawmate/settings/profile/profile-client.tsx
import * as React from "react";
import { Camera, Mail, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsField } from "../_components/settings-section";
import { toast } from "sonner";

const TIMEZONES = [
  "Asia/Kuala_Lumpur", "Asia/Singapore", "Asia/Jakarta", "Asia/Bangkok",
  "Asia/Hong_Kong", "Asia/Tokyo", "Australia/Sydney", "Europe/London",
  "America/New_York", "America/Los_Angeles", "UTC",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa Malaysia" },
  { value: "zh", label: "中文" },
  { value: "ta", label: "தமிழ்" },
];

export function ProfileSettings() {
  const [name, setName] = React.useState("Aisyah Rahman");
  const [email, setEmail] = React.useState("aisyah@technova.my");
  const [phone, setPhone] = React.useState("+60 12-345 6789");
  const [title, setTitle] = React.useState("Head of People Operations");
  const [bio, setBio] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kuala_Lumpur");
  const [language, setLanguage] = React.useState("en");
  const [saving, setSaving] = React.useState(false);

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated");
    }, 600);
  };

  return (
    <SettingsPage
      title="Profile"
      description="Your personal details and how others see you in the workspace."
      footer={{ onSave, saving, hint: "Your name and photo are visible to team members." }}
    >
      <SettingsSection
        title="Photo"
        description="A clear headshot works best — JPG or PNG, at least 200×200."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src="" alt="" />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Camera className="size-3.5" /> Upload
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" /> Remove
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Basic info" description="How you appear across LegAI.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsField label="Full name" required htmlFor="profile-name">
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </SettingsField>
          <SettingsField label="Job title" htmlFor="profile-title">
            <Input
              id="profile-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Associate"
            />
          </SettingsField>
          <SettingsField
            label="Email"
            description="Used for sign-in and notifications."
            required
            htmlFor="profile-email"
          >
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </SettingsField>
          <SettingsField label="Phone" htmlFor="profile-phone">
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </SettingsField>
          <SettingsField
            label="Bio"
            description="A short introduction shown on your profile."
            htmlFor="profile-bio"
            className="md:col-span-2"
          >
            <Textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I lead people operations at TechNova…"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Regional"
        description="Used for dates, currency, and default language across LegAI."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsField label="Timezone" htmlFor="profile-tz">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="profile-tz">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Language" htmlFor="profile-lang">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="profile-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Contact"
        description="How teammates and clients can reach you."
        action={<Button size="sm" variant="outline" className="gap-1.5"><Mail className="size-3.5" />Copy email</Button>}
      >
        <p className="text-sm text-muted-foreground">
          Your primary email is <span className="font-medium text-foreground">{email}</span>.
        </p>
      </SettingsSection>
    </SettingsPage>
  );
}
