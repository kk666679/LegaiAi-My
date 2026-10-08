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
import { trpcReact } from "@/clients";
import { getToken } from "@/lib/auth";

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
  const me = trpcReact.auth.me.useQuery();
  const updateProfile = trpcReact.auth.updateProfile.useMutation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kuala_Lumpur");
  const [language, setLanguage] = React.useState("en");
  const [saving, setSaving] = React.useState(false);
  const [photoPath, setPhotoPath] = React.useState<string | null>(null);
  const [photoSrc, setPhotoSrc] = React.useState<string | undefined>();
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!photoPath) { setPhotoSrc(undefined); return; }
    const controller = new AbortController();
    let objectUrl: string | undefined;
    const token = getToken();
    void fetch(`/api/blob/file?pathname=${encodeURIComponent(photoPath)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load profile photo");
      objectUrl = URL.createObjectURL(await response.blob());
      setPhotoSrc(objectUrl);
    }).catch(() => { if (!controller.signal.aborted) setPhotoSrc(undefined); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photoPath]);

  React.useEffect(() => {
    if (!me.data) return;
    setName(me.data.name ?? "");
    setEmail(me.data.email);
    setPhone(me.data.profile?.phone ?? "");
    setTitle(me.data.profile?.jobTitle ?? "");
    setBio(me.data.profile?.bio ?? "");
    setTimezone(me.data.profile?.timezone ?? "Asia/Kuala_Lumpur");
    setLanguage(me.data.profile?.language ?? "en");
    setPhotoPath(me.data.profile?.profilePhoto ?? null);
  }, [me.data]);

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onSave = () => {
    setSaving(true);
    updateProfile.mutate({
      name,
      phone: phone || null,
      jobTitle: title || null,
      bio: bio || null,
      timezone,
      language: language as "en" | "ms" | "zh" | "ta",
      profilePhoto: photoPath,
    }, {
      onSuccess: async () => {
        setSaving(false);
        const previousPhoto = me.data?.profile?.profilePhoto;
        if (previousPhoto && previousPhoto !== photoPath) {
          const token = getToken();
          await fetch("/api/blob", {
            method: "DELETE",
            headers: { "content-type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ pathname: previousPhoto }),
          }).catch(() => undefined);
        }
        await me.refetch();
        toast.success("Profile updated");
      },
      onError: (error: Error) => {
        setSaving(false);
        toast.error(error.message || "Could not update profile");
      },
    });
  };

  const onPhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", "profile");
    void fetch("/api/blob/upload", {
      method: "POST",
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: form,
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.pathname) throw new Error(result.error || "Photo upload failed");
      setPhotoPath(result.pathname as string);
      toast.success("Photo uploaded. Save your profile to apply it.");
    }).catch((error) => toast.error(error instanceof Error ? error.message : "Photo upload failed"));
  };

  return (
    <SettingsPage
      title="Profile"
      description="Your personal details and how others see you in the workspace."
      footer={{ onSave, saving: saving || updateProfile.isPending, hint: "Your name and photo are visible to team members." }}
    >
      <SettingsSection
        title="Photo"
        description="A clear headshot works best — JPG or PNG, at least 200×200."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            {photoSrc ? <AvatarImage src={photoSrc} alt="Profile photo" /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={onPhotoSelected} aria-label="Choose profile photo" />
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => photoInputRef.current?.click()}>
              <Camera className="size-3.5" /> Upload
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => {
              setPhotoPath(null);
              if (photoInputRef.current) photoInputRef.current.value = "";
              toast.info("Photo will be removed when you save your profile.");
            }}>
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
              disabled
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
        action={<Button size="sm" variant="outline" className="gap-1.5" onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            toast.success("Email copied");
          } catch {
            toast.error("Could not copy email");
          }
        }}><Mail className="size-3.5" />Copy email</Button>}
      >
        <p className="text-sm text-muted-foreground">
          Your primary email is <span className="font-medium text-foreground">{email}</span>.
        </p>
      </SettingsSection>
    </SettingsPage>
  );
}
