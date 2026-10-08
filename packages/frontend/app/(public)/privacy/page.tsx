import { BRAND } from '@/lib/brand';

export default function PrivacyPage() {
  return <article className="mx-auto max-w-3xl px-4 pb-20 pt-32"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{BRAND.name}</p><h1 className="mt-4 font-heading text-4xl font-bold">Privacy</h1><p className="mt-6 leading-relaxed text-muted-foreground">We respect the confidentiality of legal teams and their clients. We collect only information needed to provide, secure, and improve our services, and we do not sell personal information.</p><h2 className="mt-10 font-heading text-xl font-semibold">Your control</h2><p className="mt-3 leading-relaxed text-muted-foreground">For questions about access, correction, retention, or deletion, contact our team through the request access page.</p></article>;
}
