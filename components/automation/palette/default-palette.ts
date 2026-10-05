// components/automation/palette/default-palette.ts
import type { PaletteItem } from "../types";

export const DEFAULT_PALETTE: PaletteItem[] = [
  // Triggers
  { kind: "trigger", title: "Form submitted", description: "When a form is submitted", accent: "violet", icon: "inbox", category: "Triggers", keywords: ["form", "intake", "submit"] },
  { kind: "trigger", title: "Webhook received", description: "When an HTTP webhook fires", accent: "violet", icon: "webhook", category: "Triggers", keywords: ["http", "endpoint"] },
  { kind: "trigger", title: "Scheduled", description: "On a schedule or cron", accent: "violet", icon: "clock", category: "Triggers", keywords: ["cron", "timer"] },

  // Actions
  { kind: "action", title: "Create matter", description: "Open a new matter", accent: "blue", icon: "file", category: "Matters", keywords: ["case", "open"] },
  { kind: "action", title: "Notify user", description: "Send a notification", accent: "blue", icon: "message", category: "Communication", keywords: ["email", "message"] },
  { kind: "action", title: "Upload document", description: "Attach a document to a matter", accent: "blue", icon: "file", category: "Documents", keywords: ["attach", "file"] },
  { kind: "action", title: "Call AI", description: "Invoke an AI model", accent: "blue", icon: "bot", category: "AI", keywords: ["llm", "inference", "generate"] },

  // Conditions
  { kind: "condition", title: "If/else", description: "Branch on a boolean", accent: "amber", icon: "branch", category: "Logic", keywords: ["branch", "if"] },
  { kind: "condition", title: "Filter", description: "Continue when predicate matches", accent: "amber", icon: "filter", category: "Logic", keywords: ["where", "predicate"] },
  { kind: "condition", title: "Switch", description: "Route by value", accent: "amber", icon: "branch", category: "Logic", keywords: ["case", "match"] },

  // Delays / Loops / Human
  { kind: "delay", title: "Wait", description: "Pause for a duration", accent: "cyan", icon: "clock", category: "Time", keywords: ["sleep", "delay"] },
  { kind: "loop", title: "For each", description: "Iterate over a collection", accent: "cyan", icon: "zap", category: "Logic", keywords: ["repeat", "loop"] },
  { kind: "human", title: "Request approval", description: "Wait for human approval", accent: "pink", icon: "user", category: "Human", keywords: ["approve", "review"] },

  // Outputs
  { kind: "output", title: "Persist", description: "Store output on the matter", accent: "green", icon: "database", category: "Outputs", keywords: ["save", "record"] },
  { kind: "output", title: "Return response", description: "Return a response to the caller", accent: "green", icon: "zap", category: "Outputs", keywords: ["respond", "return"] },
];

export const PALETTE_CATEGORIES = Array.from(new Set(DEFAULT_PALETTE.map((i) => i.category)));
