"use client";

import { BRAND } from '@/lib/brand';
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    if (!email.includes("@")) {
      setError("Enter a valid work email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <section className="min-h-[calc(100dvh-8rem)] px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Early access</p>
          <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl">Bring an AI legal team into your workflow.</h1>
          <p className="mt-5 max-w-lg text-pretty leading-relaxed text-muted-foreground">Tell us about your team and we&apos;ll help you explore a secure, human-governed {BRAND.name} workspace.</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><ShieldCheck className="size-5 text-primary" /> No commitment. Your details stay private.</div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-2xl shadow-primary/5 sm:p-8">
          {submitted ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <CheckCircle2 className="size-12 text-primary" />
              <h2 className="mt-5 font-heading text-2xl font-semibold">Request received</h2>
              <p className="mt-3 max-w-sm leading-relaxed text-muted-foreground">Thanks for your interest. Our team will follow up with next steps for your legal workspace.</p>
              <Button asChild className="mt-7"><Link href="/legalai">Explore {BRAND.name} <ArrowRight data-icon="inline-end" /></Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div><h2 className="font-heading text-2xl font-semibold">Request early access</h2><p className="mt-2 text-sm text-muted-foreground">A few details help us tailor the conversation.</p></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required placeholder="Your name" /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="company">Organisation</Label><Input id="company" name="company" required placeholder="Company or firm" /></div>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" required placeholder="you@organisation.com" aria-invalid={Boolean(error)} />{error && <p className="text-sm text-destructive">{error}</p>}</div>
              <div className="flex flex-col gap-2"><Label htmlFor="message">What would you like to improve?</Label><Textarea id="message" name="message" required placeholder="Compliance, research, drafting, governance..." /></div>
              <Button type="submit" size="lg" className="w-full">Submit request <ArrowRight data-icon="inline-end" /></Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
