'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const kdream = require('../kdream');

function tmpWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'autoclaw-kdream-'));
  const learnings = path.join(root, 'learnings');
  fs.mkdirSync(learnings, { recursive: true });
  fs.mkdirSync(path.join(root, 'kdream', 'memory'), { recursive: true });
  return { learningsDir: learnings, memoryPath: path.join(root, 'kdream', 'memory', 'MEMORY.md') };
}

function writeInsight(dir, name, { tags = ['x'], promoted = true, title = 'Insight' } = {}) {
  fs.writeFileSync(
    path.join(dir, name),
    `---\nid: ${name}\nagent: hermes\ntags: [${tags.join(',')}]\npromoted: ${promoted}\n---\n\n# ${title}\n\nBody of ${name}.\n`
  );
}

const phaseNames = report => report.phases.map(p => p.name);

test('kdream: empty learnings directory renders the placeholder', async () => {
  const ws = tmpWorkspace();
  const r = await kdream.createDreamer(ws).runCycle({ mode: 'light' });
  assert.equal(r.ok, true);
  assert.ok(fs.readFileSync(ws.memoryPath, 'utf8').includes('_(none)_'));
});

test('kdream: light mode runs load → promote → reflect', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md');
  const r = await kdream.createDreamer(ws).runCycle({ mode: 'light' });
  assert.deepEqual(phaseNames(r), ['load', 'promote', 'reflect']);
});

test('kdream: deep mode inserts patterns before reflect', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md');
  const r = await kdream.createDreamer(ws).runCycle({ mode: 'deep' });
  assert.deepEqual(phaseNames(r), ['load', 'promote', 'patterns', 'reflect']);
});

test('kdream: full mode adds archive and keeps reflect last', async () => {
  const ws = tmpWorkspace();
  for (let i = 0; i < 5; i++) writeInsight(ws.learningsDir, `insight-${i}.md`);
  const d = kdream.createDreamer({ ...ws, policy: { memoryMaxEntries: 2 } });
  const r = await d.runCycle({ mode: 'full' });
  assert.deepEqual(phaseNames(r), ['load', 'promote', 'patterns', 'archive', 'reflect']);
  const ar = r.phases.find(p => p.name === 'archive');
  assert.equal(ar.archived, 3);
  assert.equal(ar.kept, 2);
});

test('kdream: only insights flagged promoted reach MEMORY.md', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md', { promoted: true, title: 'A' });
  writeInsight(ws.learningsDir, 'insight-b.md', { promoted: false, title: 'B' });
  await kdream.createDreamer(ws).runCycle({ mode: 'light' });
  const content = fs.readFileSync(ws.memoryPath, 'utf8');
  assert.ok(content.includes('insight-a.md'));
  assert.ok(!content.includes('insight-b.md'));
});

test('kdream: excludeTags blocks promotion', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md', { tags: ['draft'] });
  await kdream.createDreamer(ws).runCycle({ mode: 'light' });
  assert.ok(fs.readFileSync(ws.memoryPath, 'utf8').includes('_(none)_'));
});

test('kdream: promoteTags allow-list admits only tagged insights', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md', { tags: ['citation'] });
  writeInsight(ws.learningsDir, 'insight-b.md', { tags: ['style'] });
  const r = await kdream.createDreamer({ ...ws, policy: { promoteTags: ['citation'] } }).runCycle({ mode: 'light' });
  assert.deepEqual(r.phases.find(p => p.name === 'promote').files, ['insight-a.md']);
});

test('kdream: maxPromotionsPerCycle clamps the promoted set', async () => {
  const ws = tmpWorkspace();
  for (let i = 0; i < 4; i++) writeInsight(ws.learningsDir, `insight-${i}.md`);
  const r = await kdream.createDreamer({ ...ws, policy: { maxPromotionsPerCycle: 2 } }).runCycle({ mode: 'light' });
  assert.equal(r.phases.find(p => p.name === 'promote').promoted, 2);
});

test('kdream: dry-run computes the cycle and writes nothing', async () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-a.md');
  const d = kdream.createDreamer({ ...ws, policy: { dryRun: true } });
  const r = await d.runCycle({ mode: 'light' });
  assert.equal(r.dryRun, true);
  assert.equal(r.phases.find(p => p.name === 'promote').promoted, 1);
  assert.equal(fs.existsSync(ws.memoryPath), false, 'dry-run must not create the file');
});

test('kdream: deep mode surfaces recurring patterns and renders them', async () => {
  const ws = tmpWorkspace();
  for (const [f, t] of [['insight-1.md', 'One'], ['insight-2.md', 'Two'], ['insight-3.md', 'Three']]) {
    writeInsight(ws.learningsDir, f, { tags: ['citation'], title: t });
  }
  const r = await kdream.createDreamer({ ...ws, policy: { patternMinOccurrences: 3 } }).runCycle({ mode: 'deep' });
  assert.equal(r.phases.find(p => p.name === 'patterns').count, 1);
  assert.ok(fs.readFileSync(ws.memoryPath, 'utf8').includes('### citation'), 'patterns land in MEMORY.md');
});

test('kdream: a failing phase is recorded and the cycle still completes', async () => {
  const ws = tmpWorkspace();
  // learningsDir points at a file, so the load phase cannot enumerate it.
  const bogus = path.join(ws.memoryPath, '..', 'not-a-directory');
  fs.writeFileSync(bogus, 'this is a file, not a directory');
  const r = await kdream.createDreamer({ ...ws, learningsDir: bogus }).runCycle({ mode: 'deep' });

  assert.equal(r.phases.find(p => p.name === 'load').ok, false);
  assert.equal(r.phases.find(p => p.name === 'patterns').ok, true, 'later phases still run');
  assert.equal(r.ok, false, 'a failed phase fails the cycle');
  assert.equal(r.cycleId, 1);
});

test('kdream: concurrent cycle is refused', async () => {
  const ws = tmpWorkspace();
  const d = kdream.createDreamer(ws);
  const first = d.runCycle({ mode: 'light' });
  await assert.rejects(() => d.runCycle({ mode: 'light' }), /already running/);
  await first;
  assert.equal(d.isRunning(), false);
});

test('kdream: unknown mode is rejected before any work happens', async () => {
  const ws = tmpWorkspace();
  await assert.rejects(() => kdream.createDreamer(ws).runCycle({ mode: 'nope' }), /Unknown mode/);
  assert.equal(fs.existsSync(ws.memoryPath), false);
});

test('kdream: parseInsight reads front-matter types', () => {
  const ws = tmpWorkspace();
  writeInsight(ws.learningsDir, 'insight-x.md', { tags: ['a', 'b'], promoted: true, title: 'Title X' });
  const [ins] = kdream.listInsights(ws.learningsDir);
  assert.equal(ins.front.promoted, true);
  assert.deepEqual(ins.front.tags, ['a', 'b']);
  assert.equal(ins.title, 'Title X');
  assert.equal(ins.file, 'insight-x.md');
  assert.ok(ins.mtime > 0);
});

test('kdream: listInsights tolerates a missing directory', () => {
  assert.deepEqual(kdream.listInsights('/nonexistent/learnings'), []);
});

test('kdream: detectPatterns needs recurrence and skips excluded tags', () => {
  const insights = [
    { file: 'a.md', title: 'A', front: { tags: ['rare'] } },
    { file: 'b.md', title: 'B', front: { tags: ['common'] } },
    { file: 'c.md', title: 'C', front: { tags: ['common'] } },
    { file: 'd.md', title: 'D', front: { tags: ['common'] } },
    { file: 'e.md', title: 'E', front: { tags: ['draft', 'common'] } }
  ];
  const p = kdream.detectPatterns(insights, { minOccurrences: 3 });
  assert.ok(p.common);
  assert.equal(p.common[0], 'Seen in 3 insights (latest: `d.md`).');
  assert.ok(!p.rare);
});

test('kdream: rankInsights puts promoted first, then newest', () => {
  const ranked = kdream.rankInsights([
    { file: 'insight-1.md', front: { promoted: false } },
    { file: 'insight-3.md', front: { promoted: true } },
    { file: 'insight-2.md', front: { promoted: true } }
  ]);
  assert.deepEqual(ranked.map(i => i.file), ['insight-3.md', 'insight-2.md', 'insight-1.md']);
});

test('kdream: journal is bounded and metrics aggregate per phase', async () => {
  const ws = tmpWorkspace();
  const journal = new kdream.DreamJournal({ capacity: 3 });
  const d = kdream.createDreamer({ ...ws, journal });
  await d.runCycle({ mode: 'light' });
  await d.runCycle({ mode: 'deep' });
  assert.ok(journal.size() <= 3, `journal grew to ${journal.size()}`);
  const snap = d.metricsSnapshot();
  assert.equal(snap.cycles, 2);
  assert.equal(snap.phases.load.runs, 2);
  assert.equal(snap.phases.patterns.runs, 1);
});

test('kdream: journal flushes through an injected sink', async () => {
  const seen = [];
  const journal = new kdream.DreamJournal({ sink: { write: async batch => { seen.push(...batch); } } });
  journal.write('a', { n: 1 });
  journal.write('b', { n: 2 });
  assert.deepEqual(await journal.flush(), { flushed: 2 });
  assert.equal(journal.size(), 0);
  assert.deepEqual(seen.map(e => e.kind), ['a', 'b']);
});

test('kdream: createDreamer resolves the default paths under .autoclaw/', () => {
  const d = kdream.createDreamer();
  assert.ok(d.memoryPath.endsWith(path.join('kdream', 'memory', 'MEMORY.md')));
  assert.ok(d.learningsDir.endsWith('learnings'));
});