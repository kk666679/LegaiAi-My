import { EventEmitter } from 'events';


class HttpTransport extends EventEmitter {
  constructor({ path = '/mcp', corsOrigin = '*' } = {}) {
    super();
    this.path = path; this.corsOrigin = corsOrigin;
    this.sessionId = `sess_${Math.random().toString(36).slice(2, 12)}`;
    this.clients = new Set();
  }
  _cors(res) {
    res.setHeader('Access-Control-Allow-Origin', this.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  }
  _readBody(req) {
    return new Promise((res, rej) => {
      let b = '';
      req.on('data', c => { b += c; if (b.length > 4 * 1024 * 1024) { rej(new Error('Body too large')); req.destroy(); } });
      req.on('end', () => res(b));
      req.on('error', rej);
    });
  }
  _json(res, status, o) {
    const s = JSON.stringify(o);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(s) });
    res.end(s);
  }
  _sse(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Mcp-Session-Id': this.sessionId });
    res.write(`event: endpoint\ndata: ${this.path}?sessionId=${this.sessionId}\n\n`);
    const client = { res, send: m => res.write(`event: message\ndata: ${JSON.stringify(m)}\n\n`) };
    this.clients.add(client);
    const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 15000);
    req.on('close', () => { clearInterval(ka); this.clients.delete(client); });
  }
  send(m) { for (const c of this.clients) c.send(m); return this.clients.size > 0; }
  reply(r) { this.emit('_reply', r); return true; }
  handler() {
    return async (req, res) => {
      this._cors(res);
      const url = (req.url || '').split('?')[0];
      if (url !== this.path) { res.writeHead(404); res.end('Not found'); return; }
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      if (req.method === 'GET') { this._sse(req, res); return; }
      if (req.method === 'POST') {
        let raw; try { raw = await this._readBody(req); } catch (e) { this._json(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: e.message } }); return; }
        let msg; try { msg = JSON.parse(raw || '{}'); } catch (e) { this._json(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
        res.setHeader('Mcp-Session-Id', this.sessionId);
        const reply = await new Promise(resolve => {
          const once = r => { this.removeListener('_reply', once); resolve(r); };
          this.on('_reply', once); this.emit('message', msg);
          setTimeout(() => { this.removeListener('_reply', once); resolve(null); }, 30000);
        });
        if (reply) this._json(res, 200, reply); else { res.writeHead(202); res.end(); }
        return;
      }
      res.writeHead(405); res.end('Method not allowed');
    };
  }
}
;

export { HttpTransport };
