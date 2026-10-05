"use strict";
/**
 * eval/traces/store.js — Trace store for eval replay.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

class EvalTracer {
  constructor({ dir = '.autoclaw/eval/traces/data' } = {}) {
    this.dir = dir;
  }

  start({ agentId, goal, context }) {
    const id = crypto.randomUUID();
    const trace = {
      id,
      agentId,
      goal,
      context,
      startedAt: Date.now(),
      events: [],
      record: (type, data) => trace.events.push({ type, data, at: Date.now() }),
      finish: (data) => {
        trace.finishedAt = Date.now();
        trace.result = data;
        this.persist(trace).catch(console.error);
      },
    };
    return trace;
  }

  async persist(trace) {
    await fs.mkdir(this.dir, { recursive: true });
    const file = path.join(this.dir, `${trace.id}.json`);
    await fs.writeFile(file, JSON.stringify(trace, null, 2));
  }

  async load(id) {
    const file = path.join(this.dir, `${id}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  }
}

exports.EvalTracer = EvalTracer;
exports.evalTracer = new EvalTracer();