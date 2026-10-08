import { createServer } from 'http';

export class HealthServer {
  constructor({ port, getStatus }) {
    this.port = port;
    this.getStatus = getStatus;
    this.server = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url, `http://localhost:${this.port}`);

          if (url.pathname === '/health' || url.pathname === '/healthz') {
            const status = await this.getStatus();
            res.writeHead(status.healthy ? 200 : 503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
            return;
          }

          if (url.pathname === '/ready' || url.pathname === '/readyz') {
            const status = await this.getStatus();
            const ready = status.state === 'running' && status.healthy;
            res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ready }));
            return;
          }

          if (url.pathname === '/live' || url.pathname === '/livez') {
            res.writeHead(200);
            res.end('OK');
            return;
          }

          if (url.pathname === '/metrics') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('# No metrics collected yet');
            return;
          }

          res.writeHead(404);
          res.end();
        } catch (error) {
          console.error('[health] Error:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        console.log(`[daemon] Health server listening on :${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}
