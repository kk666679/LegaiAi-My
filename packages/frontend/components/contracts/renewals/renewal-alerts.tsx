"use client";
import * as React from "react";
import type { RenewalAlert } from "../types";
import { RenewalCard } from "./renewal-card";

export function RenewalAlerts({ alerts, onSelect }: { alerts: RenewalAlert[]; onSelect?: (a: RenewalAlert) => void }) {
  if (!alerts.length) return <p className="text-sm text-muted-foreground">No renewals approaching.</p>;
  const sorted = [...alerts].sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());
  return <div className="space-y-2">{sorted.map((a) => <RenewalCard key={a.id} alert={a} onSelect={onSelect} />)}</div>;
}
