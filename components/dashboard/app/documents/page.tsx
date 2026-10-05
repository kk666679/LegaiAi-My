// app/documents/page.tsx
import {
  DocumentsProvider,
  DocumentsShell,
  DocumentsHeader,
  DocumentsNavigation,
  DocumentsOverview,
} from "@/components/documents";

export default function DocumentsPage() {
  return (
    <DocumentsProvider documents={[]} folders={[]}>
      <DocumentsShell
        header={
          <DocumentsHeader
            title="Documents"
            description="Create, analyse, and manage your legal documents."
          />
        }
        sidebar={<DocumentsNavigation />}
      >
        <DocumentsOverview
          stats={{
            total: 0,
            ready: 0,
            processing: 0,
            review: 0,
            pendingApproval: 0,
            analysed: 0,
            favorites: 0,
          }}
          recent={[]}
          activity={[]}
        />
      </DocumentsShell>
    </DocumentsProvider>
  );
}
