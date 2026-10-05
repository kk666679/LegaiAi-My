#!/usr/bin/env node
'use strict';
const { readJson, writeJson, nowIso } = require('./_util');

const hb = readJson('autobuild/scheduler-heartbeat.json');
hb.lastBeat = nowIso();
hb.consecutiveMisses = 0;
hb.state = 'healthy';
writeJson('autobuild/scheduler-heartbeat.json', hb);
console.log('heartbeat ->', hb.lastBeat);
