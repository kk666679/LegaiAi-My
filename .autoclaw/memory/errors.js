'use strict';

class MemoryError extends Error {
  constructor(m, meta) { super(m); this.name = 'MemoryError'; this.code = 'MEMORY_ERROR'; this.meta = meta || {}; }
}
class UnknownSessionError extends MemoryError {
  constructor(id) { super('Unknown session: ' + id, { id }); this.code = 'UNKNOWN_SESSION'; }
}
class CapacityError extends MemoryError {
  constructor(limit) { super('Capacity exceeded: ' + limit, { limit }); this.code = 'CAPACITY_EXCEEDED'; }
}
class UnknownEntryError extends MemoryError {
  constructor(id) { super('Unknown entry: ' + id, { id }); this.code = 'UNKNOWN_ENTRY'; }
}
class PersistenceError extends MemoryError {
  constructor(m, meta) { super(m, meta); this.code = 'PERSISTENCE_ERROR'; }
}

module.exports = { MemoryError, UnknownSessionError, CapacityError, UnknownEntryError, PersistenceError };
