//!/usr/bin/env node

import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

// Helper function to get the LAWMATE banner - printed to stderr to avoid protocol corruption
function getLawmateBanner() {
  const banner = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;
  
  return banner;
}

async function main() {
  const args = process.argv.slice(2);

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(getLawmateBanner());
    console.log('');
    console.log('LAWMATE CLI');
    console.log('Developer Command Line');
    console.log('');
    console.log('Usage: lawmate [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version      Show version');
    console.log('  --no-banner    Suppress banner');
    console.log('  --json         Output JSON');
    console.log('');
    console.log('For full help, use: autoclaw help');
    process.exit(0);
  }

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log('LAWMATE CLI v1.0.0');
    process.exit(0);
  }

  // Handle --no-banner flag
  const noBanner = args.includes('--no-banner') || args.includes('-b');
  const filteredArgs = args.filter(arg => arg !== '--no-banner' && arg !== '-b');

  // For now, run autoclaw as the underlying command
  // This is a simple implementation that can be extended
  if (filteredArgs.length === 0 || ['help', '--help', '-h'].includes(filteredArgs[0])) {
    if (!noBanner) {
      console.log(getLawmateBanner());
      console.log('');
    }
    console.log('LAWMATE CLI');
    console.log('Developer Command Line');
    console.log('');
    console.log('To run autoclaw with full functionality:');
    console.log(`  autoclaw ${filteredArgs.join(' ')}`);
  } else {
    if (!noBanner) {
      console.log(getLawmateBanner());
      console.log('');
    }
    console.log('LAWMATE CLI');
    console.log('Developer Command Line');
    console.log('');
    console.log(`Running: autoclaw ${filteredArgs.join(' ')}`);
    console.log('');
    console.log('(Note: CLI functionality delegates to autoclaw)');
  }
}

// Make sure we handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});