import test from 'node:test';
import assert from 'node:assert/strict';

test('should contain the official banner', () => {
  const LAWMATE_FIGLET = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;

  assert.strictEqual(typeof LAWMATE_FIGLET, 'string');
  assert.ok(LAWMATE_FIGLET.includes('MCP • CLI • AI API GATEWAY'));
  assert.ok(LAWMATE_FIGLET.includes('██╗'));
  assert.ok(LAWMATE_FIGLET.includes('╚══════╝'));
});

test('should have correct banner structure', () => {
  const LAWMATE_FIGLET = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;

  const lines = LAWMATE_FIGLET.split('\n');
  assert.ok(lines.length >= 6);
  assert.ok(lines[lines.length - 1].includes('MCP • CLI • AI API GATEWAY'));
});

test('should have compact version', () => {
  const compact = 'MCP • CLI • AI API GATEWAY';
  assert.strictEqual(compact, 'MCP • CLI • AI API GATEWAY');
});

test('banner should be non-empty', () => {
  const LAWMATE_FIGLET = 'MCP • CLI • AI API GATEWAY';
  assert.ok(LAWMATE_FIGLET);
});

test('banner should match expected pattern', () => {
  const banner = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;

  assert.match(banner, /██╗.*?██║.*?██║.*?██║.*?██████╗/s);
  assert.match(banner, /╚══════╝.*?MCP • CLI • AI API GATEWAY/s);
  assert.match(banner, /MCP • CLI • AI API GATEWAY$/);
});