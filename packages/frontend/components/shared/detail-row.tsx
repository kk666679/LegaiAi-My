interface DetailRowProps {
  label: string;
  value: string;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}
