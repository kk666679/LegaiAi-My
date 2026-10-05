import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { initTelemetry } from '../../telemetry/cli-tracer.js';

export class AutoClawDaemon {
  constructor({ config }) {
    this.config = config;
    this.state = 'stopped';
    this.startedAt = null;
  }

  async start() {
    return initTelemetry('daemon', 'start').startSpan(async (span) => {
      this.state = 'starting';
      span.setAttribute('daemon.state', 'starting');
      // Start the daemon process if not already running
      const daemonPath = '../../daemon/autoclawd.js';
      const child = spawn('node', [daemonPath], {
        stdio: ['pipe', 'pipe', 'inherit'],
        env: { ...process.env, AUTOCLAW_DAEMON: 'true' },
      });

      child.stdout.on('data', (data) => {
        console.log(`[daemon] ${data}`);
      });

      child.stderr.on('data', (data) => {
        console.error(`[daemon] ${data}`);
      });

      await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('spawn', resolve);
        child.on('exit', (code) => {
          if (code === 0) {
            this.state = 'running';
            this.startedAt = Date.now();
            span.setAttribute('daemon.state', 'running');
            resolve();
          } else {
            span.recordException(new Error(`Daemon exited with code ${code}`));
            reject(new Error(`Daemon failed to start with code ${code}`));
          }
        });
      });
    });
  }

  async stop({ timeoutMs = 30000 } = {}) {
    return initTelemetry('daemon', 'stop').startSpan(async (span) => {
      this.state = 'stopping';
      span.setAttribute('daemon.state', 'stopping');
      // Implement graceful shutdown logic here
      // For now, just log and return
      span.addEvent('daemon.stop', { timeoutMs });
    });
  }

  async health() {
    return {
      state: this.state,
      uptime: this.state === 'running' ? Date.now() - this.startedAt : 0,
      healthy: this.state === 'running',
    };
  }
}