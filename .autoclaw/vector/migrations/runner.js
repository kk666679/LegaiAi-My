const fs = require('fs/promises');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { createHash } = require('crypto');

class VectorMigrator {
  constructor({ dbPath, schemaDir }) {
    this.db = new DatabaseSync(dbPath);
    this.schemaDir = schemaDir;
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  async migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL,
        checksum TEXT
      );
    `);

    const applied = new Set(
      this.db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version)
    );

    const files = (await fs.readdir(this.schemaDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      if (applied.has(version)) continue;

      const sql = await fs.readFile(path.join(this.schemaDir, file), 'utf8');
      const checksum = this.checksum(sql);

      this.db.exec(sql);
      this.db.prepare(
        'INSERT INTO schema_migrations (version, applied_at, checksum) VALUES (?, ?, ?)'
      ).run(version, Date.now(), checksum);

      console.log(`[vector] Applied migration: ${version}`);
    }
  }

  checksum(text) {
    return createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  close() {
    this.db.close();
  }
}

module.exports = { VectorMigrator };