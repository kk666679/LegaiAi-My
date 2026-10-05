PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS embeddings (
  owner      TEXT NOT NULL,
  key        TEXT NOT NULL,
  dim        INTEGER NOT NULL,
  model      TEXT NOT NULL,
  vector     BLOB NOT NULL,
  meta       TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner, key)
);
CREATE INDEX IF NOT EXISTS idx_embed_model ON embeddings(model);

CREATE TABLE IF NOT EXISTS preferences (
  owner      TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner, key)
);
