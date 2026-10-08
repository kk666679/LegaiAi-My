import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return <section className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Contact</p><h1 className="mt-4 text-balance font-heading text-4xl font-bold sm:text-5xl">Let&apos;s talk about your legal workflow.</h1><p className="mt-6 leading-relaxed text-muted-foreground">For product questions, partnerships, or early access, send us your details and our team will follow up.</p><Button asChild className="mt-8"><Link href="/request-access">Start a conversation</Link></Button></section>;
}
