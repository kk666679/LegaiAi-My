import { CapsuleBuilder } from './capsule/builder.js';
import { HashChain } from './chain/hash-chain.js';
import { AppendOnlyStore } from './storage/append-only-store.js';
import { TraceLinker } from './capture/trace-linker.js';
import { Replayer } from './replay/replayer.js';
import { ComplianceExport } from './export/compliance-export.js';
import { evidenceTracer } from './observability/tracer.js';
import { evidenceMetrics } from './observability/metrics.js';

export class Evidence {
  constructor({ config = {} } = {}) {
    this.chain = new HashChain({ genesis: config.genesisHash ?? 'GENESIS' });
    this.store = new AppendOnlyStore({ path: config.path ?? '.autoclaw/evidence/chain.jsonl' });
    this.builder = new CapsuleBuilder();
    this.linker = new TraceLinker({ otelEndpoint: config.otelEndpoint });
    this.replayer = new Replayer({ store: this.store });
    this.exporter = new ComplianceExport({ store: this.store, chain: this.chain });
  }

  async capture({ event, actor, context = {}, traceId }) {
    return evidenceTracer.startSpan('evidence.capture', async (span) => {
      span.setAttribute('event.type', event.type);
      span.setAttribute('actor.id', actor.id);

      const linked = traceId ? await this.linker.link({ event, traceId }) : { traces: [], spans: [] };

      const capsule = await this.builder.build({
        event,
        actor,
        context,
        linked,
        timestamp: Date.now(),
      });

      const prev = this.chain.last();
      const hash = this.chain.compute(capsule, prev);

      const record = { ...capsule, hash, prevHash: prev?.hash ?? null };
      await this.store.append(record);
      this.chain.advance(record);

      evidenceMetrics.increment('evidence.captured', { type: event.type });
      span.setAttribute('evidence.hash', hash);
      return record;
    });
  }

  async verify(recordId) {
    const record = await this.store.get(recordId);
    if (!record) return { valid: false, reason: 'not_found' };

    const prev = record.prevHash ? await this.store.getByHash(record.prevHash) : null;
    const expectedHash = this.chain.compute(record, prev);
    const valid = expectedHash === record.hash;

    return {
      valid,
      hash: record.hash,
      expectedHash,
      reason: valid ? 'ok' : 'hash_mismatch',
    };
  }

  async verifyChain() {
    return this.chain.verify(await this.store.iterate());
  }

  async replay({ fromTs = 0, toTs = Date.now() } = {}) {
    return this.replayer.replay({ fromTs, toTs });
  }

  async export({ fromTs, toTs, actor, format = 'json' }) {
    return this.exporter.export({ fromTs, toTs, actor, format });
  }

  async stats() {
    return {
      totalCapsules: await this.store.count(),
      lastHash: this.chain.last()?.hash,
      chainValid: (await this.verifyChain()).valid,
    };
  }
}

export function createEvidence(config) {
  return new Evidence(config);
}
