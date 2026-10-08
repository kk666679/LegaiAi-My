declare function normalizeActNumber(rawActNumber: any): string;
declare function inferDocumentType(
  actNumber: any,
  opts?: { historical?: boolean }
): string;

export { normalizeActNumber, inferDocumentType };
export type { };