/**
 * @lawmate/gateway — HTTP API server.
 *
 * Controlled API access to the LAWMATE platform.
 * Pipeline: Client → Auth → Safety → Registry → Orchestrator → Agents/Tools/Knowledge/Memory → Evidence → Evaluation → Response
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { PolicyEngine } from '@lawmate/safety';
import { RegistryCatalog } from '@lawmate/registry';
import { TaskQueue, SprintBoard } from '@lawmate/orchestrator';
import { MemoryStore } from '@lawmate/memory';
import { KnowledgeGraph } from '@lawmate/kg';
import { EvidenceChain } from '@lawmate/evidence';

export interface GatewayOptions {
  port?: number;
  host?: string;
  apiKey?: string;
}

export class GatewayServer {
  private server: ReturnType<typeof createServer> | undefined;
  private actualPort = 3001;
  private readonly registry = new RegistryCatalog();
  private readonly queue = new TaskQueue();
  private readonly board = new SprintBoard();
  private readonly memory = new MemoryStore();
  private readonly kg = new KnowledgeGraph();
  private readonly evidence = new EvidenceChain();
  private readonly policy = new PolicyEngine();

  constructor(private readonly options: GatewayOptions = {}) {}

  private authorize(req: IncomingMessage): boolean {
    if (!this.options.apiKey) return true;
    const auth = req.headers['authorization'] ?? '';
    return auth === `Bearer ${this.options.apiKey}`;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const path = url.pathname;
    const method = req.method ?? 'GET';

    if (!this.authorize(req)) {
      this.json(res, 401, { error: 'Unauthorized' });
      return;
    }

    if (path === '/health' && method === 'GET') {
      this.json(res, 200, {
        status: 'ok',
        version: '1.0.0',
        system: 'LAWMATE AI API GATEWAY',
        components: {
          registry: this.registry.stats().total,
          queue: this.queue.stats(),
          memory: this.memory.size(),
          kg: this.kg.stats(),
          evidence: this.evidence.size(),
        },
      });
      return;
    }

    if (path === '/registry' && method === 'GET') {
      this.json(res, 200, { entries: this.registry.list() });
      return;
    }

    if (path === '/queue' && method === 'GET') {
      this.json(res, 200, { stats: this.queue.stats(), tasks: this.queue.list() });
      return;
    }

    if (path === '/memory' && method === 'GET') {
      this.json(res, 200, { size: this.memory.size() });
      return;
    }

    if (path === '/kg' && method === 'GET') {
      this.json(res, 200, this.kg.stats());
      return;
    }

    if (path === '/evidence' && method === 'GET') {
      this.json(res, 200, { size: this.evidence.size(), entries: this.evidence.export() });
      return;
    }

    this.json(res, 404, { error: 'Not found', path });
  }

  private json(res: ServerResponse, status: number, body: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          this.json(res, 500, { error: (err as Error).message });
        });
      });
      this.server.listen(this.options.port ?? 0, this.options.host ?? '0.0.0.0', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          this.actualPort = address.port;
        }
        resolve(this.actualPort ?? this.options.port ?? 0);
      });
      this.server.on('error', reject);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getRegistry(): RegistryCatalog { return this.registry; }
  getQueue(): TaskQueue { return this.queue; }
  getBoard(): SprintBoard { return this.board; }
  getMemory(): MemoryStore { return this.memory; }
  getKg(): KnowledgeGraph { return this.kg; }
  getEvidence(): EvidenceChain { return this.evidence; }
}