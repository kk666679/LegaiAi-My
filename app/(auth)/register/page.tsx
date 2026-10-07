"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/navigation/Logo";
import { Sparkles } from "lucide-react";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <RegisterForm />
    </div>
  );
}

function RegisterForm() {
  const { signup, isAuthenticated } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/legalai");
  }, [isAuthenticated, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      setError("Workspace URL may only contain lowercase letters, numbers and dashes.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        email,
        password,
        name: name.trim() || undefined,
        orgName,
        orgSlug,
      });
      router.push("/legalai");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create the workspace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div aria-hidden="true" className="absolute inset-0 -z-10 glow-radial" />

      <div className="relative rounded-2xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-primary/5 sm:p-8 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center" aria-label={`${BRAND.name} home`}>
            <Logo variant="full" size="lg" />
          </Link>
          <h1 className="mt-6 font-heading text-2xl font-semibold text-foreground">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a new {BRAND.name} workspace for your legal team
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Your name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aina Rahman"
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Work email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="orgName" className="text-sm font-medium text-foreground">
              Organisation name
            </Label>
            <Input
              id="orgName"
              type="text"
              required
              minLength={2}
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (!slugTouched) setOrgSlug(slugify(e.target.value));
              }}
              placeholder="Rahman &amp; Partners"
              autoComplete="organization"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="orgSlug" className="text-sm font-medium text-foreground">
              Workspace URL
            </Label>
            <div className="flex items-center rounded-md border border-border/70 bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 pr-1 text-sm text-muted-foreground" aria-hidden="true">
                /w/
              </span>
              <Input
                id="orgSlug"
                type="text"
                required
                value={orgSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setOrgSlug(slugify(e.target.value));
                }}
                placeholder="rahman-partners"
                className="border-0 bg-transparent focus-visible:ring-0"
                aria-describedby="orgSlug-hint"
              />
            </div>
            <p id="orgSlug-hint" className="text-xs text-muted-foreground">
              Lowercase letters, numbers and dashes only.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20" role="alert">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Sparkles className="size-4" aria-hidden="true" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] hover:from-[hsl(var(--brand-blue-dark))] hover:to-[hsl(var(--brand-indigo))] shadow-[0_10px_30px_-12px_hsl(var(--brand-blue)/0.4)] transition-all"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating workspace…
              </span>
            ) : (
              "Create workspace"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating a workspace, you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

              Lowercase letters, numbers and dashes only.
            </p>
          </div>
