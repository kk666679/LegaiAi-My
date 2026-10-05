import Database from 'better-sqlite3';

export class FailureKG {
  constructor({ path = '.autoclaw/kg/kg.db' } = {}) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.ensureSchema();
  }

  ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS failure_incidents (
        id TEXT PRIMARY KEY,
        failure_class TEXT NOT NULL,
        symptom TEXT NOT NULL,
        root_cause TEXT,
        confidence REAL,
        remediation_action TEXT,
        remediation_status TEXT,
        outcome TEXT,
        actor TEXT,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER,
        trace_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_failure_class ON failure_incidents(failure_class);
      CREATE INDEX IF NOT EXISTS idx_failure_created ON failure_incidents(created_at);

      CREATE TABLE IF NOT EXISTS failure_patterns (
        id TEXT PRIMARY KEY,
        failure_class TEXT NOT NULL,
        cause TEXT NOT NULL,
        evidence_signature TEXT NOT NULL,
        occurrence_count INTEGER DEFAULT 1,
        success_rate REAL DEFAULT 0.0,
        last_seen INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pattern_class ON failure_patterns(failure_class);
    `);
  }

  async record({ diagnosis, outcome, actor }) {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO failure_incidents
      (id, failure_class, symptom, root_cause, confidence, remediation_action, remediation_status, outcome, actor, created_at, resolved_at, trace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      diagnosis.classification.class,
      JSON.stringify(diagnosis.correlated.symptom ?? {}),
      diagnosis.rca.rootCause,
      diagnosis.rca.confidence,
      diagnosis.recommendation?.action,
      diagnosis.recommendation?.status,
      outcome?.status,
      actor,
      Date.now(),
      outcome?.resolved ? Date.now() : null,
      diagnosis.traceId
    );

    this.upsertPattern({
      failureClass: diagnosis.classification.class,
      cause: diagnosis.rca.rootCause,
      evidenceSignature: this.signature(diagnosis),
    });

    return { id };
  }

  async queryPatterns({ failureClass, context }) {
    const rows = this.db.prepare(`
      SELECT * FROM failure_patterns
      WHERE failure_class = ?
      ORDER BY occurrence_count DESC, success_rate DESC
      LIMIT 10
    `).all(failureClass);
    return rows;
  }

  upsertPattern({ failureClass, cause, evidenceSignature }) {
    const existing = this.db.prepare(`
      SELECT * FROM failure_patterns WHERE failure_class = ? AND cause = ? AND evidence_signature = ?
    `).get(failureClass, cause, evidenceSignature);

    if (existing) {
      this.db.prepare(`
        UPDATE failure_patterns
        SET occurrence_count = occurrence_count + 1, last_seen = ?
        WHERE id = ?
      `).run(Date.now(), existing.id);
    } else {
      this.db.prepare(`
        INSERT INTO failure_patterns (id, failure_class, cause, evidence_signature, occurrence_count, last_seen)
        VALUES (?, ?, ?, ?, 1, ?)
      `).run(crypto.randomUUID(), failureClass, cause, evidenceSignature, Date.now());
    }
  }

  signature(diagnosis) {
    const parts = [
      diagnosis.classification.class,
      ...(diagnosis.anomalies ?? []).map((a) => a.metric),
    ];
    return parts.sort().join('|');
  }
}
