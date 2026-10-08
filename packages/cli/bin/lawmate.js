#!/usr/bin/env node
/**
 * @lawmate/cli — LAWMATE CLI binary entry point.
 *
 * Usage: lawmate <command> [options]
 */
import { main } from '../dist/index.js';

const exitCode = main(process.argv);
process.exit(exitCode);