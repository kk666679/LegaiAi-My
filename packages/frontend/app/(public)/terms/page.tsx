import { BRAND } from '@/lib/brand';

export default function TermsPage() {
  return <article className="mx-auto max-w-3xl px-4 pb-20 pt-32"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{BRAND.name}</p><h1 className="mt-4 font-heading text-4xl font-bold">Terms of service</h1><p className="mt-6 leading-relaxed text-muted-foreground">{BRAND.name} provides workflow tools to support legal professionals. Outputs are assistive, must be reviewed by qualified people, and do not constitute legal advice.</p><h2 className="mt-10 font-heading text-xl font-semibold">Responsible use</h2><p className="mt-3 leading-relaxed text-muted-foreground">You are responsible for safeguarding workspace data, verifying sources, and ensuring each use complies with applicable law and professional obligations.</p></article>;
}
