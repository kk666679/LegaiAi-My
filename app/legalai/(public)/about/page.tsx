import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export default function AboutPage() {
  return <section className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">About {BRAND.name}</p><h1 className="mt-4 text-balance font-heading text-4xl font-bold sm:text-5xl">Legal technology for the real world.</h1><p className="mt-6 text-pretty leading-relaxed text-muted-foreground">We are building practical, governed AI systems that help legal teams move faster while keeping people accountable for consequential decisions.</p><Button asChild className="mt-8"><Link href="/request-access">Request early access</Link></Button></section>;
}
