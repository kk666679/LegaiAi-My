import React from "react";
import { Scale, Leaf, Coins, Bot, Users, Shield, Home, Gavel } from "lucide-react";
import { Area, Status } from "./types";

export const AREAS: Area[] = [
  "ESG",
  "DIGITAL_ASSETS",
  "AI",
  "HUMAN_RIGHTS",
  "CYBER",
  "ESTATE",
  "ARBITRATION",
];

export const AREA_OPTIONS: Area[] = AREAS;

export const STATUSES: Status[] = [
  "Active",
  "Pending",
  "Amended",
  "Guidance",
];

export const STATUS_VARIANT: Record<
  Status,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Active: "default",
  Pending: "secondary",
  Amended: "outline",
  Guidance: "destructive",
};

export const STATUS_STYLES: Record<Status, string> = {
  Active: "border-emerald-500 text-emerald-700",
  Pending: "border-amber-500 text-amber-700",
  Amended: "border-blue-500 text-blue-700",
  Guidance: "border-purple-500 text-purple-700",
};

export const AREA_LABELS: Record<Area, string> = {
  ESG: "ESG",
  DIGITAL_ASSETS: "Digital Assets",
  AI: "AI",
  HUMAN_RIGHTS: "Human Rights",
  CYBER: "Cyber",
  ESTATE: "Estate",
  ARBITRATION: "Arbitration",
};

export const AREA_ICONS: Record<Area, React.ElementType> = {
  ESG: Leaf,
  DIGITAL_ASSETS: Coins,
  AI: Bot,
  HUMAN_RIGHTS: Users,
  CYBER: Shield,
  ESTATE: Home,
  ARBITRATION: Gavel,
};

export const AREA_COLORS: Record<Area, string> = {
  ESG: "bg-emerald-100 text-emerald-800",
  DIGITAL_ASSETS: "bg-purple-100 text-purple-800",
  AI: "bg-rose-100 text-rose-800",
  HUMAN_RIGHTS: "bg-blue-100 text-blue-800",
  CYBER: "bg-orange-100 text-orange-800",
  ESTATE: "bg-teal-100 text-teal-800",
  ARBITRATION: "bg-indigo-100 text-indigo-800",
};