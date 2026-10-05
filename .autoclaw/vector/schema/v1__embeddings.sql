-- v1__embeddings.sql — Base vector embeddings schema.

CREATE TABLE IF NOT EXISTS embeddings (
  doc_id TEXT NOT NULL,
  embedding BLOB NOT NULL,
  model TEXT NOT NULL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (doc_id, model)
);

CREATE INDEX IF NOT EXISTS idx_embeddings_model ON embeddings(model);
CREATE INDEX IF NOT EXISTS idx_embeddings_created ON embeddings(created_at);