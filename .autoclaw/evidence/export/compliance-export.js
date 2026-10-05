import { createSign } from 'crypto';

export class ComplianceExport {
  constructor({ store, chain, privateKey = null } = {}) {
    this.store = store;
    this.chain = chain;
    this.privateKey = privateKey;
  }

  async export({ fromTs = 0, toTs = Date.now(), actor = null, format = 'json' }) {
    const records = await this.store.query({ fromTs, toTs, actor });

    const attestation = await this.attest(records);

    if (format === 'json') {
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        fromTs,
        toTs,
        actor,
        recordCount: records.length,
        chainValid: (await this.chain.verify(records)).valid,
        attestation,
        records,
      };
    }

    if (format === 'csv') {
      return this.toCSV(records);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  async attest(records) {
    const summary = {
      count: records.length,
      fromTs: records[0]?.timestamp,
      toTs: records[records.length - 1]?.timestamp,
      firstHash: records[0]?.hash,
      lastHash: records[records.length - 1]?.hash,
    };

    const payload = JSON.stringify(summary);
    const signature = this.privateKey
      ? createSign('sha256').update(payload).sign(this.privateKey, 'hex')
      : null;

    return { ...summary, signature, signed: !!signature };
  }

  toCSV(records) {
    const headers = ['id', 'timestamp', 'type', 'actor', 'hash', 'prevHash'];
    const lines = [headers.join(',')];
    for (const r of records) {
      lines.push([
        r.id,
        r.timestamp,
        r.event?.type,
        r.actor?.id,
        r.hash,
        r.prevHash,
      ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }
}
