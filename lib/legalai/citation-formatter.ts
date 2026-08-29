export interface Citation {
  caseName: string;
  year: number;
  volume: number;
  journal: string;
  page: number;
}

export function formatMLJ(citation: Citation): string {
  return `**${citation.caseName} [${citation.year}] ${citation.volume} MLJ ${citation.page}**`;
}

export function parseCitation(text: string): Citation | null {
  const mljPattern = /(.+?)\\s*\\[(\\d{4})\\]\\s*(\\d+)\\s*MLJ\\s*(\\d+)/i;
  const match = text.match(mljPattern);
  
  if (!match) return null;
  
  return {
    caseName: match[1]?.trim() ?? '',
    year: parseInt(match[2] ?? '0'),
    volume: parseInt(match[3] ?? '0'),
    journal: "MLJ",
    page: parseInt(match[4] ?? '0'),
  };
}

