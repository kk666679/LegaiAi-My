"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/navigation/Logo";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";

/**
 * Self-service password reset is NOT available in this deployment: the
 * backend exposes no reset/request-token procedure and no mail service is
 * configured. This page therefore gives users accurate next steps instead of
 * simulating a reset email that would never arrive.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div aria-hidden="true" className="absolute inset-0 -z-10 glow-radial" />

        <div className="relative rounded-2xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-primary/5 sm:p-8 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center justify-center" aria-label={`${BRAND.name} home`}>
              <Logo variant="full" size="lg" />
            </Link>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-foreground">Reset your password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Password recovery for your {BRAND.name} workspace
            </p>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-4">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                Automatic email reset is not enabled for this deployment. Your
                password can only be changed by a workspace administrator, or by
                you once you are signed in.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <span className="font-medium text-foreground">Already signed in?</span>{" "}
                Open Settings → Security to change your password directly.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-4">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <span className="font-medium text-foreground">Need access?</span>{" "}
                Ask your workspace administrator to reset it, or{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  contact support
                </Link>{" "}
                for assistance.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              className="w-full bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] shadow-[0_10px_30px_-12px_hsl(var(--brand-blue)/0.4)]"
              onClick={() => router.push("/login")}
            >
              Back to sign in
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => router.push("/legalai/settings/security")}
            >
              Open password settings
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Questions?{" "}
            <Link href="/contact" className="hover:underline">Contact us</Link> ·{" "}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
