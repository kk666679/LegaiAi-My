import fs from 'fs';
import path from 'path';



const ROOT = path.resolve(import.meta.dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function writeJson(rel, value) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(value, null, 2) + '\n');
}
function writeText(rel, text) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}
function appendJsonl(rel, obj) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.appendFileSync(abs, JSON.stringify(obj) + '\n');
}
function nowIso() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

;

export { ROOT, readJson, writeJson, writeText, appendJsonl, nowIso, today };
