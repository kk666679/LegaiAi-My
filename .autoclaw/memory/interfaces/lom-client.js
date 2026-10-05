export function normalizeActNumber(value = '') {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const trimmed = text.replace(/^act\s+/i, '').trim();
  return trimmed.replace(/^\s+|\s+$/g, '');
}

export function buildLegislationPdfUrl(actNumber = '', title = '') {
  const raw = String(actNumber || title || '').trim();
  const normalized = normalizeActNumber(raw) || 'Act';
  const encoded = encodeURIComponent(`Act ${normalized}`);
  return `https://lom.agc.gov.my/ilims/upload/portal/akta/outputaktap/${encoded}.pdf`;
}

export function inferDocumentType(actNumber = '', options = {}) {
  const raw = String(actNumber ?? '');
  const lower = raw.toLowerCase();
  const value = normalizeActNumber(raw);

  if (String(actNumber || '').toLowerCase().includes('constitution') || String(options?.title || '').toLowerCase().includes('constitution')) return 'federal-constitution';
  if (/(^p\.u\.|^pu\()/i.test(raw) || /^(P\.U\.|PU\()/i.test(raw) || /p\.u\./i.test(raw)) return 'subsidiary';
  if (/^a\d+/i.test(value)) return 'amendment';
  if (options?.historical === true) return 'historical';
  if (!value) return 'unknown';
  return 'principal';
}

export class LOMClient {
  constructor({ fetcher = null } = {}) {
    this.fetcher = fetcher;
  }

  async getAct(identifier = '', overrides = {}) {
    const normalizedId = normalizeActNumber(identifier);
    const docType = overrides.docType || inferDocumentType(normalizedId, overrides);
    const title = overrides.title || `Act ${normalizedId}`;

    return {
      id: normalizedId || 'unknown',
      act_number: normalizedId || 'unknown',
      title,
      source: 'LOM',
      status: overrides.status || 'unknown',
      document_type: docType,
      version: overrides.version || 'unknown',
      source_url: overrides.sourceUrl || buildLegislationPdfUrl(normalizedId, title),
      publication_date: overrides.publicationDate || null,
      royal_assent: overrides.royalAssent || null,
      commencement_date: overrides.commencementDate || null,
      created_at: new Date().toISOString(),
    };
  }
}
