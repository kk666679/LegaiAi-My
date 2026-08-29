const PLACEHOLDERS = [
  "LEGAL OPERATIONS",
  "ENTERPRISE",
  "COMPLIANCE",
  "RISK",
  "CORPORATE LEGAL",
];

export function TrustBar() {
  return (
    <section id="solutions" className="border-y border-border/60 bg-card/30 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <p className="text-center text-sm text-muted-foreground text-balance">
          Designed for teams where accuracy, security and accountability matter.
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {PLACEHOLDERS.map((label) => (
            <li
              key={label}
              className="font-heading text-xs font-semibold tracking-[0.22em] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
