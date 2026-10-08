PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('case','statute','concept','reflection','document')),
  title       TEXT NOT NULL,
  canonical   TEXT NOT NULL,
  body        TEXT,
  salience    REAL NOT NULL DEFAULT 0.5,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  last_seen   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_nodes_canonical ON nodes(canonical);
CREATE INDEX IF NOT EXISTS idx_nodes_type      ON nodes(type);

CREATE TABLE IF NOT EXISTS edges (
  id         TEXT PRIMARY KEY,
  from_id    TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_id      TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  rel        TEXT NOT NULL,
  weight     REAL NOT NULL DEFAULT 0.5,
  inferred   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(from_id);
CREATE INDEX IF NOT EXISTS idx_edges_to   ON edges(to_id);
CREATE INDEX IF NOT EXISTS idx_edges_rel  ON edges(rel);

CREATE TABLE IF NOT EXISTS tags (
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (node_id, tag)
);

CREATE TABLE IF NOT EXISTS sources (
  id           TEXT PRIMARY KEY,
  url          TEXT,
  title        TEXT,
  retrieved_at INTEGER,
  checksum     TEXT
);
