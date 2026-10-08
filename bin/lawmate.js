#!/usr/bin/env node
/**
 * LAWMATE CLI binary entry point.
 *
 * Usage: lawmate <command> [options]
 */
import { main } from '../packages/cli/dist/index.js';

const exitCode = main(process.argv);
process.exit(exitCode);