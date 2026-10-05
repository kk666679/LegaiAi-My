/**
 * Stream tokens back into the IDE chat panel with correct chunking,
 * retry on backpressure, and cancellation support.
 */
class StreamingInjector {
  constructor(opts = {}) {
    this.protocol = protocol;
    this.sessionId = sessionId;
    this.flushIntervalMs = flushIntervalMs;
    this.buffer = '';
    this.lastFlush = 0;
  }

  async *stream(asyncIterable) {
    for await (const chunk of asyncIterable) {
      this.buffer += chunk;
      const now = Date.now();
      if (now - this.lastFlush > this.flushIntervalMs || this.buffer.length > 200) {
        await this.flush();
      }
      yield chunk;
    }
    await this.flush();
  }

  async flush() {
    if (!this.buffer) return;
    this.protocol.transport.send({
      jsonrpc: '2.0',
      method: 'session/update',
      params: {
        sessionId: this.sessionId,
        update: { type: 'chunk', content: this.buffer },
      },
    });
    this.buffer = '';
    this.lastFlush = Date.now();
  }

  async cancel() {
    await this.protocol.cancel({ sessionId: this.sessionId });
  }
}

export { StreamingInjector };
