#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_util');

const stores = [
  { name: 'kg',     db: 'kg/kg.db',       schema: 'kg/schema.sql' },
  { name: 'spine',  db: 'spine/spine.db', schema: 'spine/schema.sql' },
  { name: 'vector', db: 'vector/db.sqlite', schema: 'vector/schema.sql' }
];

const report = stores.map(s => {
  const dbAbs = path.join(ROOT, s.db);
  const schemaAbs = path.join(ROOT, s.schema);
  return {
    name: s.name,
    db: s.db,
    exists: fs.existsSync(dbAbs),
    bytes: fs.existsSync(dbAbs) ? fs.statSync(dbAbs).size : 0,
    schema: s.schema,
    schemaExists: fs.existsSync(schemaAbs)
  };
});
console.log(JSON.stringify(report, null, 2));
