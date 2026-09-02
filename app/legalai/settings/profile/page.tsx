"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Camera, User as UserIcon } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MOCK_USER } from "@/lib/lawmate/data";

export default function ProfileSettingsPage() {
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [phone, setPhone] = useState("+60 12-345 6789");
  const [barNumber, setBarNumber] = useState("BC/N/1234");
  const [bio, setBio] = useState("Senior associate specialising in employment and data protection law.");
  const fileRef = useRef<HTMLInputElement>(null);

  const saveProfile = () => toast.success("Profile saved", { description: `${name} · ${barNumber}` });
  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) toast.success(`Photo updated: ${f.name}`);
  };

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>How you appear to your team and clients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" /> Change photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" type="email" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bar number</Label>
              <Input value={barNumber} onChange={(e) => setBarNumber(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Bio</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button className="gap-2" onClick={saveProfile}>
              <Save className="size-4" /> Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
