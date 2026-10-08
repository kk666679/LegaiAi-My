#!/usr/bin/env node
import { parseArgs } from './args.js';
import { loadCommands } from './commands/index.js';
import { initTelemetry } from './telemetry/cli-tracer.js';
import { printResult, printUsage } from './output/formatters.js';

const COMMANDS = await loadCommands();
const { command, subcommand, args, flags } = parseArgs(process.argv);

if (!command) {
  printUsage(COMMANDS);
  process.exit(0);
}

const cmd = COMMANDS[command];
if (!cmd) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const tracer = initTelemetry();
const span = tracer.startSpan(`cli.${command}.${subcommand || 'default'}`);

try {
  const result = await cmd.run({ subcommand, args, flags });
  span.setStatus({ code: 0 });
  if (!flags.quiet) printResult(result, flags);
  process.exit(0);
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: 2, message: error.message });
  console.error(`[error] ${error.message}`);
  process.exit(1);
} finally {
  span.end();
}
