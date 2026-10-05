import { colorize } from './color.js';

export function printUsage(commands) {
  console.log(colorize('Usage: autoclaw <command> [subcommand] [options]', 'bold'));
  console.log('');
  console.log(colorize('Commands:', 'bold'));
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${colorize(name, 'cyan')} - ${cmd.description}`);
  }
  console.log('');
  console.log('Options:');
  console.log('  --json           Output as JSON');
  console.log('  --yaml           Output as YAML');
  console.log('  --table          Output as table (default)');
  console.log('  --no-color       Disable colored output');
  console.log('  --quiet          Suppress output');
}

export function printResult(result, flags) {
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (flags.yaml) {
    printYaml(result);
  } else if (flags.table) {
    printTable(result);
  } else {
    printTable(result);
  }
}

function printTable(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log('(empty)');
      return;
    }
    // Simple table output for array of objects
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')));
    
    // Calculate column widths
    const widths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map((r) => r[i]?.length ?? 0))
    );
    
    // Print header
    const headerLine = headers
      .map((h, i) => h.padEnd(widths[i]))
      .join(' │ ');
    console.log(colorize(headerLine, 'bold'));
    console.log('─'.repeat(headerLine.length));
    
    // Print rows
    for (const row of rows) {
      console.log(row.map((cell, i) => cell.padEnd(widths[i])).join(' │ '));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      const label = colorize(`${key}:`, 'cyan');
      console.log(`${label} ${formatValue(value)}`);
    }
  } else {
    console.log(formatValue(data));
  }
}

function printYaml(data, indent = 0) {
  const prefix = '  '.repeat(indent);
  
  if (Array.isArray(data)) {
    for (const item of data) {
      console.log(`${prefix}- `);
      if (typeof item === 'object' && item !== null) {
        printYaml(item, indent + 1);
      } else {
        console.log(`${prefix}  ${formatValue(item)}`);
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        console.log(`${prefix}${key}:`);
        printYaml(value, indent + 1);
      } else {
        console.log(`${prefix}${key}: ${formatValue(value)}`);
      }
    }
  } else {
    console.log(`${prefix}${formatValue(data)}`);
  }
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return colorize('(null)', 'gray');
  }
  if (typeof value === 'boolean') {
    return colorize(String(value), value ? 'green' : 'red');
  }
  if (typeof value === 'number') {
    return colorize(String(value), 'yellow');
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}
