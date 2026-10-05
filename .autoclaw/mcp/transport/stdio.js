'use strict';
const { EventEmitter } = require('events');
const readline = require('readline');

class StdioTransport extends EventEmitter {
  constructor({ stdin = process.stdin, stdout = process.stdout } = {}) {
    super();
    this.stdin = stdin; this.stdout = stdout; this.closed = false;
    this._rl = readline.createInterface({ input: stdin, crlfDelay: Infinity });
    this._rl.on('line', line => this._onLine(line));
    this._rl.on('close', () => this._onClose());
  }
  _onLine(line) {
    const s = String(line == null ? '' : line).trim();
    if (!s) return;
    try { this.emit('message', JSON.parse(s)); }
    catch (e) { this.emit('parseError', { line: s, error: e }); }
  }
  _onClose() { if (!this.closed) { this.closed = true; this.emit('close'); } }
  send(msg) {
    if (this.closed) return false;
    try { this.stdout.write(JSON.stringify(msg) + '\n'); return true; }
    catch (e) { this.emit('error', e); return false; }
  }
  close() { if (this.closed) return; this.closed = true; try { this._rl.close(); } catch (_) {} this.emit('close'); }
}
module.exports = { StdioTransport };
