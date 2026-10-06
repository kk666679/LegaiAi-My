PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  workflow TEXT NOT NULL,
  agent TEXT,
  sprint TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  status TEXT NOT NULL DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,
  actor TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'done'
);

CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_events_run ON events(run_id, ts);
CREATE INDEX IF NOT EXISTS idx_decisions_run ON decisions(run_id, ts);
CREATE INDEX IF NOT EXISTS idx_milestones_run ON milestones(run_id, ts);
