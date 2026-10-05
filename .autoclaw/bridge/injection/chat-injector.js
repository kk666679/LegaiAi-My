import { StreamingInjector } from "./streaming-injector.js";

class ChatInjector {
  constructor(opts = {}) {
    this.target = target;
    this.protocol = protocol;
    this.sessionId = sessionId;
    this.agent = agt;
    this.streaming = new StreamingInjector({ protocol, sessionId });
  }

  async inject(message) {
    if (typeof message === 'string') {
      return this.injectText(message);
    }
    return this.injectObject(message);
  }

  async injectText(text) {
    if (!this.protocol) {
      return { delivered: false, reason: 'no protocol' };
    }

    try {
      if (text.length > 200) {
        await this.streaming.stream((async function* () {
          yield text;
        })());
      } else {
        this.protocol.transport.send({
          jsonrpc: '2.0',
          method: 'session/update',
          params: {
            sessionId: this.sessionId,
            update: { type: 'message', content: text },
          },
        });
      }
      return { delivered: true, method: 'chat' };
    } catch (error) {
      return { delivered: false, error: error.message };
    }
  }

  async injectObject(message) {
    const text = JSON.stringify(message);
    return this.injectText(text);
  }
}

export { ChatInjector };
