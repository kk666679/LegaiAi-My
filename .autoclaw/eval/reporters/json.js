"use strict";
/**
 * eval/reporters/json.js — JSON reporter.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs/promises');
const path = require('path');

const jsonReporter = {
  async report(summary) {
    const file = `.autoclaw/eval/reports/${summary.suite}-${Date.now()}.json`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(summary, null, 2));
  },
};

exports.jsonReporter = jsonReporter;