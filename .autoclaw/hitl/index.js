'use strict';

/**
 * hitl — human-in-the-loop gate.
 *
 * Two stages: `Policy` decides *whether* a proposal needs a human, `ReviewQueue`
 * holds it until one acts. The gate resolves to a terminal DECISION, never to a
 * timeout — an unresolved review stays pending rather than silently approving.
 */

const DECISION = Object.freeze({
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MODIFIED: 'modified',
  TIMEOUT: 'timeout'
});

const REASON = Object.freeze({
  LOW_CONFIDENCE: 'low-confidence',
  HIGH_RISK: 'high-risk',
  PROHIBITED: 'prohibited',
  EXPLICIT: 'explicit'
});

const STATUS = Object.freeze({ PENDING: 'pending', RESOLVED: 'resolved' });

/**
 * Substrings that force escalation regardless of confidence. Deliberately
 * broad: a false positive costs one human glance, a false negative can put a
 * fabricated authority in front of a court.
 */
const DEFAULT_RISK_KEYWORDS = Object.freeze([
  'criminal', 'liability', 'indictment', 'prosecution', 'sentencing',
  'privileged', 'confidential', 'sanction', 'injunction', 'filing',
  'execute', 'withdraw', 'waive', 'settle', 'liable'
]);

class UnknownItemError extends Error {
  constructor(id) { super(`Unknown item: ${id}`); this.name = 'UnknownItemError'; this.code = 'UNKNOWN_ITEM'; this.id = id; }
}

class Policy {
  constructor({
    confidenceThreshold = 0.7,
    riskKeywords = DEFAULT_RISK_KEYWORDS,
    prohibited = []
  } = {}) {
    this.confidenceThreshold = Number(confidenceThreshold);
    this.riskKeywords = riskKeywords.map(k => String(k).toLowerCase());
    this.prohibited = prohibited.map(k => String(k).toLowerCase());
  }

  /**
   * @returns {{escalate: boolean, reason: string|null, confidence: number}}
   */
  evaluate({ proposal = '', confidence = null } = {}) {
    const text = String(proposal || '').toLowerCase();

    for (const p of this.prohibited) {
      if (text.includes(p)) return { escalate: true, reason: REASON.PROHIBITED, confidence, matched: p };
    }

    for (const k of this.riskKeywords) {
      if (text.includes(k)) return { escalate: true, reason: REASON.HIGH_RISK, confidence, matched: k };
    }

    if (confidence != null && Number(confidence) < this.confidenceThreshold) {
      return { escalate: true, reason: REASON.LOW_CONFIDENCE, confidence: Number(confidence) };
    }

    return { escalate: false, reason: null, confidence: confidence == null ? null : Number(confidence) };
  }
}

/** Priority-ordered review queue. Higher `priority` is served first. */
class ReviewQueue {
  constructor({ clock = () => new Date().toISOString() } = {}) {
    this.items = new Map();
    this.clock = clock;
    this._seq = 0;
  }

  enqueue({ proposal = '', confidence = null, reason = null, priority = 50, runId = null, meta = {} } = {}) {
    const id = `rv_${(++this._seq).toString(36)}`;
    const item = {
      id,
      runId,
      proposal,
      confidence,
      reason,
      priority: Number(priority) || 0,
      status: STATUS.PENDING,
      decision: null,
      by: null,
      meta,
      enqueuedAt: this.clock(),
      resolvedAt: null
    };
    this.items.set(id, item);
    return item;
  }

  /** Pending items first (priority desc), then resolved (newest first). */
  list({ status } = {}) {
    let all = [...this.items.values()];
    if (status) all = all.filter(i => i.status === status);
    return all.sort((a, b) => {
      if (a.status !== b.status) return a.status === STATUS.PENDING ? -1 : 1;
      if (a.status === STATUS.PENDING && a.priority !== b.priority) return b.priority - a.priority;
      return String(b.enqueuedAt).localeCompare(String(a.enqueuedAt));
    });
  }

  get(id) { return this.items.get(id) || null; }

  resolve(id, { decision, by = null, note = null } = {}) {
    const item = this.items.get(id);
    if (!item) throw new UnknownItemError(id);
    item.status = STATUS.RESOLVED;
    item.decision = decision;
    item.by = by;
    if (note) item.note = note;
    item.resolvedAt = this.clock();
    return item;
  }

  get size() { return this.items.size; }

  /** Counts by status plus the oldest pending item — the review-desk view. */
  stats() {
    const byStatus = {};
    for (const i of this.items.values()) {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    }
    const pending = [...this.items.values()]
      .filter(i => i.status === STATUS.PENDING)
      .sort((a, b) => b.priority - a.priority);
    return {
      total: this.items.size,
      byStatus,
      pending: pending.length,
      oldestPendingAt: pending.length ? pending[pending.length - 1].enqueuedAt : null,
      highestPriority: pending.length ? pending[0].priority : null
    };
  }
}

/**
 * Human gate. `timers` is injectable so tests can run without real timeouts;
 * omitting it uses the platform timers and a real timeout.
 */
function createHITL({ policy = {}, queue = null, timers = null, timeoutMs = 0 } = {}) {
  const pol = policy instanceof Policy ? policy : new Policy(policy);
  const q = queue || new ReviewQueue();
  const t = timers || { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: h => clearTimeout(h) };

  const gate = {
    /**
     * Resolve a proposal to a terminal decision. Auto-approves when policy
     * allows; otherwise enqueues and waits for `queue.resolve`.
     */
    async awaitDecision({ runId = null, proposal = '', confidence = null, priority = 50, meta = {} } = {}) {
      const verdict = pol.evaluate({ proposal, confidence });
      if (!verdict.escalate) {
        return {
          decision: DECISION.APPROVED,
          automatic: true,
          reason: null,
          by: 'policy',
          confidence,
          runId
        };
      }

      const item = q.enqueue({ proposal, confidence, reason: verdict.reason, priority, runId, meta });

      let handle = null;
      if (timeoutMs > 0) {
        handle = t.setTimeout(() => {
          // A timeout is a terminal decision, never an implicit approval.
          if (item.status === STATUS.PENDING) {
            q.resolve(item.id, { decision: DECISION.TIMEOUT, by: 'system' });
          }
        }, timeoutMs);
      }

      return await new Promise(resolve => {
        const poll = () => {
          const cur = q.get(item.id);
          if (cur && cur.status === STATUS.RESOLVED) {
            if (handle) t.clearTimeout(handle);
            resolve({
              decision: cur.decision,
              automatic: false,
              reason: cur.reason,
              by: cur.by,
              id: cur.id,
              confidence: cur.confidence,
              runId: cur.runId
            });
            return;
          }
          setImmediate(poll);
        };
        poll();
      });
    },

    policy: pol,
    queue: q
  };

  return { gate, queue: q, policy: pol };
}

module.exports = {
  createHITL,
  Policy,
  ReviewQueue,
  DECISION,
  REASON,
  STATUS,
  DEFAULT_RISK_KEYWORDS,
  UnknownItemError
};