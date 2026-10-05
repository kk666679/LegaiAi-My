PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS runs (
  id          TEXT PRIMARY KEY,
  workflow    TEXT NOT NULL,
  agent       TEXT,
  sprint      TEXT,
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  status      TEXT NOT NULL CHECK (status IN ('running','ok','error','cancelled')),
  meta        TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at);
CREATE INDEX IF NOT EXISTS idx_runs_status  ON runs(status);

CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id    TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts        INTEGER NOT NULL,
  kind      TEXT NOT NULL,
  payload   TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_run ON events(run_id);

CREATE TABLE IF NOT EXISTS decisions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id     TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts         INTEGER NOT NULL,
  actor      TEXT NOT NULL,
  decision   TEXT NOT NULL,
  rationale  TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id     TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts         INTEGER NOT NULL,
  name       TEXT NOT NULL,
  meta       TEXT
);
