/**
 * Ambient declarations for @modelcontextprotocol/sdk.
 *
 * The published SDK ships JS-only modules without bundled .d.ts files.
 * These declarations cover the subset of the API used by @lawmate/mcp.
 */

declare module '@modelcontextprotocol/sdk/server/index.js' {
  export class Server {
    constructor(serverInfo: { name: string; version: string }, options?: Record<string, unknown>);
    setRequestHandler(schema: { method: string }, handler: (req: any, extra: any) => Promise<unknown>): void;
    connect(transport: unknown): Promise<void>;
    close(): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    constructor(stdin?: NodeJS.ReadableStream, stdout?: NodeJS.WritableStream, options?: Record<string, unknown>);
    start(): Promise<void>;
    send(message: unknown): Promise<void>;
    close(): Promise<void>;
    onmessage: ((message: unknown) => void) | null;
    onerror: ((error: Error) => void) | null;
  }
}

declare module '@modelcontextprotocol/sdk/types.js' {
  export const ListToolsRequestSchema: { method: string };
  export const CallToolRequestSchema: { method: string };
  export const ListResourcesRequestSchema: { method: string };
  export const ListPromptsRequestSchema: { method: string };
  export const ReadResourceRequestSchema: { method: string };
  export const GetPromptRequestSchema: { method: string };
  export const InitializeRequestSchema: { method: string };
  export const PingRequestSchema: { method: string };
}

declare module '@modelcontextprotocol/sdk/server/request-handler.js' {
  export type RequestHandler = (req: unknown, extra: unknown) => Promise<unknown>;
}