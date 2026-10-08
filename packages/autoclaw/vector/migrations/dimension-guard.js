import fs from 'fs/promises';
import path from 'path';

export async function checkDimension({ vectorDir, model }) {
  const registry = JSON.parse(await fs.readFile(path.join(vectorDir, 'models/registry.json'), 'utf8'));
  const spec = registry.models[model];
  if (!spec) throw new Error(`Unknown model: ${model}`);

  const Database = (await import('better-sqlite3')).default;
  const conn = new Database(path.join(vectorDir, 'db.sqlite'), { readonly: true });
  const sample = conn.prepare('SELECT LENGTH(embedding) AS len FROM embeddings LIMIT 1').get();
  conn.close();

  if (!sample) return { ok: true, empty: true };
  const actualDim = sample.len / 4; // float32
  if (actualDim !== spec.dimensions) {
    throw new Error(`Dimension mismatch: expected ${spec.dimensions}, found ${actualDim}`);
  }
  return { ok: true, dimensions: spec.dimensions };
}