import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CareersPage() {
  return <section className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Careers</p><h1 className="mt-4 text-balance font-heading text-4xl font-bold sm:text-5xl">Help shape the future of legal work.</h1><p className="mt-6 leading-relaxed text-muted-foreground">We are growing a thoughtful team across legal, engineering, design, and operations. Tell us where you can make an impact.</p><Button asChild className="mt-8"><Link href="/contact">Contact the team</Link></Button></section>;
}
