export interface EvidenceEntry {
  seq: number; id: string; type: string; payload: unknown;
  prevHash: string; hash: string; createdAt: string;
}
