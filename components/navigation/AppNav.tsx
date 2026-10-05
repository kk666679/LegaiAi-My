import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/copilot", label: "Copilot" },
  { href: "/draft", label: "Draft" },
  { href: "/debate", label: "Debate" },
  { href: "/audit", label: "Audit" },
  { href: "/monitor", label: "Monitor" },
];

export function AppNav() {
  return (
    <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4">
      <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
        {BRAND.name}
      </Link>
      <div className="flex items-center gap-2">
        {LINKS.map(({ href, label }) => (
          <Button key={href} variant="ghost" asChild size="sm" className="text-xs font-medium">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
