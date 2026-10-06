// app/automations/[id]/builder/page.tsx
import { BuilderPage } from "./builder-client";

export default function Page({ params, searchParams }: { params: { id: string }; searchParams: { template?: string } }) {
  return <BuilderPage id={params.id} templateId={searchParams.template} />;
}
