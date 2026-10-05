-- v2__bm25.sql — BM25 keyword index (FTS5) + rerank cache.

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  doc_id UNINDEXED,
  content,
  tokenize = 'porter unicode61'
);

CREATE TABLE IF NOT EXISTS rerank_cache (
  query_hash TEXT PRIMARY KEY,
  doc_ids TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ttl_seconds INTEGER DEFAULT 3600
);

CREATE INDEX IF NOT EXISTS idx_rerank_cache_created ON rerank_cache(created_at);