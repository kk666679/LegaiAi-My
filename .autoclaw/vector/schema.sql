PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS embeddings (
  owner TEXT NOT NULL,
  key TEXT NOT NULL,
  dim INTEGER NOT NULL,
  model TEXT NOT NULL,
  vector BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner, key, model)
);

CREATE TABLE IF NOT EXISTS preferences (
  owner TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner, key)
);

CREATE INDEX IF NOT EXISTS idx_embeddings_owner ON embeddings(owner, key);
CREATE INDEX IF NOT EXISTS idx_embeddings_model ON embeddings(model);
CREATE INDEX IF NOT EXISTS idx_preferences_updated ON preferences(updated_at);
