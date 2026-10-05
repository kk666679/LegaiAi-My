const { VectorMigrator } = require('./runner.js');

module.exports = {
  VectorMigrator,
  async runMigrations({ dbPath, schemaDir }) {
    const migrator = new VectorMigrator({ dbPath, schemaDir });
    try {
      await migrator.migrate();
      return migrator.db
        .prepare('SELECT version, applied_at, checksum FROM schema_migrations ORDER BY version')
        .all();
    } finally {
      migrator.close();
    }
  }
};