import { createServer } from 'net';
import { unlink } from 'fs/promises';
import { platform } from 'os';

export class IPCServer {
  constructor({ socketPath, handlers }) {
    this.socketPath = socketPath;
    this.handlers = handlers;
    this.server = null;
    this.isWindows = platform() === 'win32';
  }

  async start() {
    // On Windows, use named pipes instead of Unix sockets
    const endpoint = this.isWindows ? `\\\\.\\pipe\\${this.socketPath}` : this.socketPath;

    return new Promise(async (resolve, reject) => {
      try {
        // Clean up old socket on Unix
        if (!this.isWindows && this.socketPath) {
          try {
            await unlink(this.socketPath);
          } catch {
            // File doesn't exist
          }
        }

        this.server = createServer((socket) => {
          let buffer = '';

          socket.on('data', async (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const { id, command, args } = JSON.parse(line);
                const handler = this.handlers[command];

                if (!handler) {
                  socket.write(
                    JSON.stringify({ id, error: `Unknown command: ${command}` }) + '\n'
                  );
                  continue;
                }

                const result = await handler(args);
                socket.write(JSON.stringify({ id, result }) + '\n');
              } catch (error) {
                socket.write(
                  JSON.stringify({
                    id: null,
                    error: error.message,
                  }) + '\n'
                );
              }
            }
          });

          socket.on('error', (error) => {
            console.error('[ipc] Socket error:', error);
          });
        });

        if (this.isWindows) {
          this.server.listen(endpoint, () => {
            console.log(`[daemon] IPC server listening on ${endpoint}`);
            resolve();
          });
        } else {
          this.server.listen(this.socketPath, () => {
            console.log(`[daemon] IPC server listening on ${this.socketPath}`);
            resolve();
          });
        }

        this.server.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise(async (resolve) => {
      if (this.server) {
        this.server.close(() => {
          if (!this.isWindows && this.socketPath) {
            unlink(this.socketPath).catch(() => {});
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
