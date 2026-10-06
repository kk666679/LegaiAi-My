#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { ROOT, readJson, writeJson, appendJsonl, nowIso } from './_util.js';

'use strict';
/**
 * supervisor — the orchestration loop, in pure Node.
 * Reads the board + loop-state, dispatches idle agents to todo items,
 * appends to the comms log, and updates loop-state. One tick, then exits.
 *
 * Invoke from cron / systemd / your own scheduler; there is no shell wrapper.
 */

const board = readJson('orchestrator/board.json');
const state = readJson('orchestrator/comms/loop-state.json');
const registry = readJson('orchestrator/comms/registry.json');

const idleAgents = Object.entries(state.agents)
  .filter(([, a]) => a.state === 'idle')
  .map(([id]) => id);

const openItems = (board.items || [])
  .filter(i => i.status === 'todo')
  .sort((a, b) => (b.priority || 0) - (a.priority || 0));

const dispatched = [];
for (const item of openItems) {
  const agent = item.owner && idleAgents.includes(item.owner) ? item.owner : idleAgents[0];
  if (!agent) break;
  idleAgents.splice(idleAgents.indexOf(agent), 1);
  item.status = 'in-progress';
  state.agents[agent] = { state: 'busy', item: item.id, since: nowIso() };
  dispatched.push({ agent, item: item.id, priority: item.priority });
}

board.items = board.items || [];

const tick = (state.tick || 0) + 1;
state.tick = tick;
state.tickedAt = nowIso();

writeJson('orchestrator/board.json', board);
writeJson('orchestrator/comms/loop-state.json', state);
appendJsonl('orchestrator/comms/comms-log.jsonl', {
  ts: nowIso(), agent: 'system', kind: 'tick', tick, dispatched: dispatched.length
});
appendJsonl('orchestrator/comms/loop-journal.jsonl', {
  ts: nowIso(), tick, durationMs: 0, agentsTouched: dispatched.length, state: 'ok'
});

if (dispatched.length) {
  const dispatchPath = path.join(ROOT, 'orchestrator', 'comms', '_wip', 'dispatch.json');
  fs.mkdirSync(path.dirname(dispatchPath), { recursive: true });
  fs.writeFileSync(dispatchPath, JSON.stringify({ tick, dispatched, ts: nowIso() }, null, 2) + '\n');
}

console.log(`supervisor tick ${tick} — dispatched ${dispatched.length} item(s)`);
