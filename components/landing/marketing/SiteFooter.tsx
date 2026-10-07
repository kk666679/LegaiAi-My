import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/navigation/Logo";

const FOOTER_HREFS: Record<string, string> = {
  "AI Agents": "/legalai/agents",
  "Regulatory Timeline": "/legalai/agents/live",
  "Legal Research": "/legalai/research",
  "Document Drafting": "/legalai/documents/studio",
  Compliance: "/legalai/compliance",
  "Corporate Legal": "/solutions/corporate",
  "Law Firms": "/solutions/law-firms",
  Risk: "/legalai/risk",
  About: "/about",
  Security: "/security",
  Careers: "/careers",
  Contact: "/contact",
  Documentation: "/resources/documentation",
  "Legal Guides": "/resources/legal-guides",
};

const COLUMNS = [
  {
    heading: "Platform",
    links: ["AI Agents", "Regulatory Timeline", "Legal Research", "Document Drafting", "Compliance"],
  },
    {
      heading: "Solutions",
      links: ["Corporate Legal", "Law Firms", "Compliance", "Risk"],
    },
    {
      heading: "Company",
      links: ["About", "Security", "Careers", "Contact"],
    },
    {
      heading: "Resources",
      links: ["Documentation", "Legal Guides"],
    },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/30 px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex" aria-label={`${BRAND.name} home`}>
              <Logo variant="wordmark" size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Legal AI that works for the real world. Specialised agents, human oversight, built for
              enterprise legal teams.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="font-heading text-sm font-semibold text-foreground">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href={FOOTER_HREFS[link] ?? "/contact"}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 {BRAND.legalName}. All rights reserved.</p>
          <ul className="flex items-center gap-6">
            {["Privacy", "Terms", "Security"].map((item) => (
              <li key={item}>
                <a href={`/${item.toLowerCase()}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
