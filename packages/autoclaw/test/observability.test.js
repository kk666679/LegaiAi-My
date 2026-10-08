'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStack, Logger, Metrics, Tracer } = require('../observability');

test('observability: logger writes JSON to stream', () => {
  const lines = [];
  const stream = { write: s => lines.push(s) };
  const log = new Logger({ level: 'info', stream });
  log.info('hello', { a: 1 });
  assert.equal(lines.length, 1);
  const rec = JSON.parse(lines[0]);
  assert.equal(rec.msg, 'hello');
  assert.equal(rec.a, 1);
});

test('observability: logger respects level', () => {
  const lines = [];
  const log = new Logger({ level: 'warn', stream: { write: s => lines.push(s) } });
  log.debug('nope'); log.info('nope'); log.warn('yes');
  assert.equal(lines.length, 1);
});

test('observability: metrics counters/gauges/histograms', () => {
  const m = new Metrics({ prefix: 'p' });
  m.inc('x_total', { k: 'a' }, 2);
  m.inc('x_total', { k: 'a' }, 3);
  m.set('y_gauge', {}, 42);
  m.observe('z_ms', 100); m.observe('z_ms', 200);
  const s = m.snapshot();
  assert.equal(s.counters['p_x_total{k="a"}'], 5);
  assert.equal(s.gauges['p_y_gauge'], 42);
  assert.equal(s.histograms['p_z_ms'].count, 2);
  assert.equal(s.histograms['p_z_ms'].p50, 200);
});

test('observability: tracer records spans', () => {
  const t = new Tracer();
  const span = t.startSpan('a', { k: 1 });
  const child = t.startSpan('b', {}, span);
  child.end({ status: 'ok' });
  span.end({ status: 'ok' });
  assert.equal(t.listTraces().length, 1);
  const trace = t.getTrace(span.traceId);
  assert.equal(trace.length, 2);
});

test('observability: createStack wires all three', () => {
  const s = createStack();
  assert.ok(s.logger instanceof Logger);
  assert.ok(s.metrics instanceof Metrics);
  assert.ok(s.tracer instanceof Tracer);
});
