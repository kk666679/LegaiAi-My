"use client";
import * as React from "react";
import { Globe, Lock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export type AccessLevel = "private" | "team" | "public";
export function AccessSummary({ level, count = 0 }: { level: AccessLevel; count?: number }) {
  const icon = level === "public" ? <Globe className="size-4" /> : level === "team" ? <Users className="size-4" /> : <Lock className="size-4" />;
  const label = level === "public" ? "Anyone with the link" : level === "team" ? `${count} team members` : "Private";
  return (
    <Card className="flex items-center gap-2 p-3 text-sm">
      {icon}
      <span>{label}</span>
    </Card>
  );
}
