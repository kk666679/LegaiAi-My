import fs from 'fs';
import path from 'path';

/**
 * memory — read `learnings/insight-*.md`, render `MEMORY.md`.
 *
 * The front-matter parser is deliberately tiny: flat `key: value` pairs with
 * inline `[a, b]` lists. A YAML library would be a dependency for a format
 * this directory owns, and a lenient parser that silently mis-reads a tag list
 * is worse than a strict one that drops the file.
 */

const HEADER = `# Consolidated Memory

> Rewritten by the memory dream cycle. Do not edit by hand — append insights
> to \`learnings/\` and let the next cycle promote them here.`;

function parseInsight(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { file: path.basename(filePath), front: {}, title: path.basename(filePath, '.md'), body: raw.trim() };

  const front = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.+)$/);
    if (!mm) continue;
    const k = mm[1];
    let v = mm[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    else if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    front[k] = v;
  }

  const body = m[2].trim();
  const titleM = body.match(/^#\s+(.+)$/m);
  return {
    file: path.basename(filePath),
    front,
    title: titleM ? titleM[1].trim() : (front.id || path.basename(filePath, '.md')),
    body
  };
}

/** All `insight-*.md` files in `dir`, oldest filename first. `mtime` drives the age gate. */
function listInsights(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('insight-') && f.endsWith('.md'))
    .sort()
    .map(f => {
      const abs = path.join(dir, f);
      const record = parseInsight(abs);
      record.mtime = fs.statSync(abs).mtimeMs;
      return record;
    });
}

function renderMemory({ insights = [], patterns = {}, stableFacts = [], openQuestions = [] } = {}) {
  const lines = [HEADER];
  if (stableFacts.length) {
    lines.push('', '## Stable facts');
    for (const f of stableFacts) lines.push(`- ${f}`);
  }
  if (Object.keys(patterns).length) {
    lines.push('', '## Recurring patterns');
    for (const [name, items] of Object.entries(patterns)) {
      lines.push(`### ${name}`);
      for (const it of items) lines.push(`- ${it}`);
    }
  }
  if (openQuestions.length) {
    lines.push('', '## Open questions');
    for (const q of openQuestions) lines.push(`- ${q}`);
  }
  lines.push('', '## Promoted from learnings/');
  if (!insights.length) lines.push('- _(none)_');
  else for (const i of insights) lines.push(`- \`${i.file}\` — ${i.title}`);
  lines.push('');
  return lines.join('\n');
}

function readMemory(file) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function writeMemory(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return content.length;
}

;

export { parseInsight, listInsights, renderMemory, readMemory, writeMemory, HEADER };
