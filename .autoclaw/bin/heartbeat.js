#!/usr/bin/env node
import { readJson, writeJson, nowIso } from './_util.js';

'use strict';

const hb = readJson('autobuild/scheduler-heartbeat.json');
hb.lastBeat = nowIso();
hb.consecutiveMisses = 0;
hb.state = 'healthy';
writeJson('autobuild/scheduler-heartbeat.json', hb);
console.log('heartbeat ->', hb.lastBeat);
