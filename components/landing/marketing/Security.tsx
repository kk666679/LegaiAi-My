"use client";

import { Lock, KeyRound, FileCheck2, ShieldCheck, Server, UserCheck } from "lucide-react";
import { useReveal } from "./use-reveal";

const CARDS = [
  { icon: KeyRound, title: "Role-based access", desc: "Granular permissions scoped to teams, matters and data." },
  { icon: FileCheck2, title: "Audit trails", desc: "Every agent action, source and edit is logged and reviewable." },
  { icon: Lock, title: "Encryption", desc: "Data encrypted in transit and at rest across the platform." },
  { icon: ShieldCheck, title: "SSO / SAML", desc: "Enterprise identity with single sign-on and provisioning." },
  { icon: Server, title: "Data isolation", desc: "Your legal context stays isolated to your organisation." },
  { icon: UserCheck, title: "Human approval", desc: "Sensitive outputs require explicit human sign-off." },
];

export function Security() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="security" ref={ref} className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/2 glow-radial" />
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for the standards of modern legal teams.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
            Security, accountability and control designed in from the ground up — because legal work
            demands it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <article
                key={c.title}
                className="reveal surface-glass surface-glass-hover group rounded-2xl p-6"
                style={{ transitionDelay: `${(i % 3) * 70}ms` }}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted/70 text-[hsl(var(--brand-cyan))] transition-colors group-hover:bg-[hsl(var(--brand-blue)/0.18)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
