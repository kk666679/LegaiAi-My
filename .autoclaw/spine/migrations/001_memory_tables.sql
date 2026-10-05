-- Memory architecture migration: short-term metadata and long-term stores.
-- STM remains in process; these tables persist LTM and access history in spine.db.

CREATE TABLE IF NOT EXISTS semantic_memories (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  agent_id TEXT,
  content TEXT NOT NULL,
  embedding BLOB,
  tags TEXT,
  salience REAL DEFAULT 0.5,
  valid_from INTEGER,
  valid_to INTEGER,
  created_at INTEGER NOT NULL,
  access_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_semantic_ns ON semantic_memories(namespace);
CREATE INDEX IF NOT EXISTS idx_semantic_agent ON semantic_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_semantic_valid ON semantic_memories(valid_from, valid_to);

CREATE TABLE IF NOT EXISTS episodic_memories (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  agent_id TEXT,
  session_id TEXT,
  event_type TEXT,
  content TEXT NOT NULL,
  outcome TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_episodic_ns ON episodic_memories(namespace);
CREATE INDEX IF NOT EXISTS idx_episodic_session ON episodic_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_episodic_created ON episodic_memories(created_at);

CREATE TABLE IF NOT EXISTS procedural_memories (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  agent_id TEXT,
  skill_name TEXT NOT NULL,
  pattern TEXT,
  success_rate REAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_procedural_skill ON procedural_memories(skill_name);

CREATE TABLE IF NOT EXISTS reflective_memories (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  agent_id TEXT,
  insight TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  evidence TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reflective_ns ON reflective_memories(namespace);

CREATE TABLE IF NOT EXISTS memory_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  agent_id TEXT,
  accessed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_access_memory ON memory_access_log(memory_id);
CREATE INDEX IF NOT EXISTS idx_access_time ON memory_access_log(accessed_at);
