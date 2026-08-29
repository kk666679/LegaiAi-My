'use client';

import { BRAND } from '@/lib/brand';
import { LegalChat } from '@/components/ai/legal/chat';

const SUGGESTIONS = [
  'Analyse a contract clause',
  'Research Malaysian employment law',
  'Draft a legal submission',
  'Check citation validity',
  'Run risk analysis on a matter',
  'Simulate opposing argument',
];

const DEMO_SOURCES = [
  { title: 'Contracts Act 1950 (Act 136)', url: 'https://www.legislation.gov.my', court: 'Federal' },
  { title: 'Employment Act 1955', url: 'https://www.legislation.gov.my', court: 'Federal' },
  { title: 'PDPA 2025 Amendment', url: 'https://www.pdp.gov.my', court: 'Statute' },
];

export default function AgentPage() {
  return (
    <div className="-mx-4 min-h-[calc(100dvh-8rem)] sm:-mx-0 xl:min-h-[calc(100dvh-3.5rem)]">
      <LegalChat
        agentName={`${BRAND.name} Copilot`}
        model="Llama 3.1 + pgVector"
        suggestions={SUGGESTIONS}
        sources={DEMO_SOURCES}
        placeholder="Describe your legal issue or question (Malaysian context)..."
      />
    </div>
  );
}
