"use client";

import * as React from "react";
import { ArrowUpRight, Command, Plus, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StudioAIMessage {
  id: string;
  role: "user" | "ai";
  author?: string;
  initials?: string;
  text: React.ReactNode;
  chips?: string[];
  time?: string;
}

interface StudioAIAssistantProps {
  messages?: StudioAIMessage[];
  running?: boolean;
  onSend?: (message: string) => void;
  className?: string;
}

const DEFAULT_MESSAGES: StudioAIMessage[] = [
  {
    id: "m1",
    role: "user",
    author: "Aria Reyes",
    initials: "AR",
    text: "Summarise the payment terms and flag anything outside our standard position.",
    time: "09:41",
  },
  {
    id: "m2",
    role: "ai",
    text: (
      <>
        <p className="mb-2">
          Payment terms are{" "}
          <strong className="font-semibold text-foreground">Net 30</strong>, which
          matches your playbook. Two deviations found:
        </p>
        <ul className="space-y-1.5">
          <li className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400" />
            <span>
              Interest at{" "}
              <strong className="text-rose-300">2.5% / month</strong> — above your 1.5% cap.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>No cure period before interest accrues.</span>
          </li>
        </ul>
      </>
    ),
    chips: ["Redline §3", "Show evidence", "Counter-propose"],
    time: "09:41",
  },
  {
    id: "m3",
    role: "user",
    author: "Aria Reyes",
    initials: "AR",
    text: "Draft a counter-proposal for clause 3.",
    time: "09:42",
  },
];

export function StudioAIAssistant({
  messages = DEFAULT_MESSAGES,
  running = true,
  onSend,
  className,
}: StudioAIAssistantProps) {
  const [message, setMessage] = React.useState("");

  const submit = () => {
    if (!message.trim()) return;
    onSend?.(message);
    setMessage("");
  };

  return (
    <div className={`flex h-full flex-col ${className ?? ""}`}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex gap-2.5">
              <Avatar className="size-6">
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[9px] font-semibold text-white">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="rounded-xl rounded-tl-sm border border-border/60 bg-muted/40 px-3 py-2 text-[12.5px] leading-relaxed">
                  {m.text}
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                  {m.time}
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="grid size-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-emerald-950">
                <Sparkles className="size-3.5" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="rounded-xl rounded-tl-sm border border-border/60 bg-muted/40 px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground/85">
                  {m.text}
                </div>
                {m.chips ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="font-mono text-[10px] text-muted-foreground/60">
                  {m.time} · 3 sources cited
                </div>
              </div>
            </div>
          )
        )}

        {running && (
          <div className="flex items-center gap-2 pl-8">
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
            <span className="ml-1 text-[11px] text-muted-foreground">Drafting…</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-xl border border-border bg-muted/30 p-2 transition focus-within:border-emerald-400/40">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Studio AI, or type / for commands…"
            className="w-full resize-none bg-transparent px-1.5 py-1 text-[12.5px] outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1">
              <button
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Attach"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Commands"
              >
                <Command className="size-3.5" />
              </button>
            </div>
            <Button
              size="icon"
              className="size-7 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-950 hover:brightness-110"
              onClick={submit}
              aria-label="Send message"
            >
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
          Studio AI can make mistakes. Verify citations before filing.
        </p>
      </div>
    </div>
  );
}
