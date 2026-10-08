import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Key, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `RBAC — Security — ${BRAND.name}`,
  description: 'Role-based access control with admin, lawyer, paralegal, and viewer roles.',
};

const PERMISSIONS = [
  { permission: 'create_case', admin: true, lawyer: true, paralegal: false, viewer: false },
  { permission: 'edit_document', admin: true, lawyer: true, paralegal: true, viewer: false },
  { permission: 'delete_document', admin: true, lawyer: false, paralegal: false, viewer: false },
  { permission: 'view_audit_log', admin: true, lawyer: true, paralegal: false, viewer: false },
  { permission: 'manage_users', admin: true, lawyer: false, paralegal: false, viewer: false },
  { permission: 'run_agents', admin: true, lawyer: true, paralegal: true, viewer: false },
  { permission: 'view_drafts', admin: true, lawyer: true, paralegal: true, viewer: true },
  { permission: 'approve_agent_action', admin: true, lawyer: true, paralegal: false, viewer: false },
];

export default function RBACPage() {
  return (
    <>
      <PageHeader
        title="Role-Based Access Control"
        description="Granular permission control with four roles. Authorization enforced server-side — never relying on hidden UI elements."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'RBAC' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/agents/audit">AI Governance <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Roles">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { role: 'Admin', desc: 'Full access. Manage users, documents, audit logs, and all system settings.', color: 'text-red-600' },
            { role: 'Lawyer', desc: 'Create cases, edit documents, run agents, approve actions, view audit logs.', color: 'text-blue-600' },
            { role: 'Paralegal', desc: 'Edit documents, run agents, view drafts. Cannot create cases or approve actions.', color: 'text-amber-600' },
            { role: 'Viewer', desc: 'View drafts only. Read-only access to the platform.', color: 'text-emerald-600' },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-border/70 bg-card/50 p-5">
              <h3 className={`font-semibold text-lg mb-2 ${r.color}`}>{r.role}</h3>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Permission Matrix">
        <div className="rounded-xl border border-border/70 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Permission</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Admin</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Lawyer</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Paralegal</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p.permission} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 text-foreground font-medium">{p.permission}</td>
                    {(['admin', 'lawyer', 'paralegal', 'viewer'] as const).map((role) => (
                      <td key={role} className="px-4 py-3 text-center">
                        {p[role] ? (
                          <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="size-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            Authorization is enforced server-side at every layer. Client-side role checks supplement but never replace server authorization.
          </p>
        </div>
      </Section>
    </>
  );
}
