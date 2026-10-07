"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { BRAND } from "@/lib/brand";
import { Logo, LawMateMark } from "@/components/navigation/Logo";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/legalai");
  }, [isAuthenticated, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(params.get("next") || "/legalai");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Background brand accents */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 glow-radial" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid-faint opacity-50" />

        <div className="relative rounded-2xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-primary/5 sm:p-8 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center justify-center" aria-label={`${BRAND.name} home`}>
              <Logo variant="full" size="lg" />
            </Link>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your {BRAND.name} workspace</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Work email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organisation.com"
                  className="focus:ring-2 focus:ring-primary/20"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus:ring-2 focus:ring-primary/20"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-state p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <Sparkles className="size-4" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] hover:from-[hsl(var(--brand-blue-dark))] hover:to-[hsl(var(--brand-indigo))] shadow-[0_10px_30px_-12px_hsl(var(--brand-blue)/0.4)] transition-all" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card/60 px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/api/auth/signin/google")}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/api/auth/signin/microsoft")}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19.72 14.87c-.06-.34-.27-.82-.52-1.07a4.52 4.52 0 00-.53-1.12.44.44 0 00-.67-.03 3.82 3.82 0 01-.36.1 3.5 3.5 0 01-1.03.06 11.36 11.36 0 01-3.28-.93.5.5 0 00-.86.14c-.56.63-1.1 1.2-1.47 1.9a.47.47 0 00-.05.75 12.34 12.34 0 003.8 3.02.5.5 0 00.69-.38 9.3 9.3 0 001.12-3.25.5.5 0 00-.09-.75zm-4.48 2.18a8.57 8.57 0 01-2.34.5c-4.48 0-7.66-3.32-7.66-7.75 0-4.61 3.45-7.9 7.96-7.9 2.25 0 4.25.9 5.72 2.22.32.29.82.3.97-.37.2-.81.1-1.6-.34-2.24a6.57 6.57 0 00-2.17-2.56c-.43-.22-.8-.56-1.22-.79-.4-.2-.66-.56-.83-.95a.44.44 0 00-.72-.11c-.53.84-1.2 1.65-1.71 2.5a.46.46 0 00-.09.77c.56 1 1.18 1.95 2.06 2.67.58.48 1.3.49 1.86-.09.3-.3.58-.7.64-1.17a9.13 9.13 0 001.4-3.86c0-3.11-1.68-5.53-4.48-5.53-3.2 0-5.78 2.53-5.78 5.63 0 1.84.8 3.45 2.17 4.44-.43-.03-.9-.09-1.25-.09-2.1 0-3.91 1.09-5.11 2.82-.4.58-.53 1.35-.32 2.06.2.7.74 1.26 1.4 1.62 2.47 1.37 5.65 1.4 8.37-.03a.5.5 0 00.68-.47zm-8.48-11.54c-.1-.5-.43-.87-.82-.87-.57 0-.97.5-.97 1.12 0 .7.5 1.07 1.13 1.07.4 0 .7-.2.9-.56l.32-.61zm3.63 10.43c-.38 0-.73-.1-1.04-.3a.44.44 0 00-.52.49c.55.42 1.2.66 2 .66 1.77 0 3.2-1.3 3.2-3.2 0-.88-.4-1.65-1.1-2.1a.46.46 0 00-.7.44c.55.37 1 1 1 1.8 0 1.5-1.1 2.7-2.7 2.7z"
                />
              </svg>
              Microsoft
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create a workspace
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}