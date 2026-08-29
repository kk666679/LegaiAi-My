export function AnimatedGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-12 gap-3 opacity-20">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-full rounded-full bg-white/5 animate-pulse"
            style={{ animationDelay: `${index * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
