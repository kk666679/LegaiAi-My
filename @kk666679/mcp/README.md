# LAWMATE MCP

Model Context Protocol server for LAWMATE.

## Installation

```bash
npm install @kk666679/mcp
```

## Quick Start

```bash
# Start MCP server with stdio transport (protocol over stdin/stdout)
node index.js

# Start MCP server with HTTP transport
node index.js
```

## Banner Display

On server startup, the official LAWMATE FIGlet banner is displayed to stderr to avoid corrupting MCP protocol messages:

```
██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                  MCP • CLI • AI API GATEWAY

LAWMATE MCP
Model Context Protocol
```

### Banner Controls

- **`LAWMATE_NO_BANNER=1`** - Suppress the banner
- **`LAWMATE_FORCE_UNICODE=1`** - Force Unicode display
- **`LAWMATE_FORCE_COMPACT=1`** - Force compact format
- The banner automatically detects terminal width and Unicode support

## MCP Protocol

The server implements the Model Context Protocol (MCP) with the following methods:

### Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initialize session with client info |
| `ping` | Ping/patch keep-alive |
| `tools/list` | List available tools |
| `tools/call` | Execute a named tool |
| `resources/list` | List available resources |
| `resources/read` | Read a resource by URI |
| `prompts/list` | List available prompts |
| `prompts/get` | Get a specific prompt |
| `logging/setLevel` | Set log level |
| `shutdown` | Graceful shutdown |

## Transport Options

### Stdio Transport

```js
const { serveStdio } = require('@kk666679/mcp');
const { server, transport, stop } = serveStdio({});
// Protocol messages via stdout
// Startup banner on stderr
```

### HTTP Transport

```js
const { serveHttp } = require('@kk666679/mcp');
const { handler } = serveHttp({});
require('http').createServer(handler).listen(7331);
// POST /mcp → JSON-RPC 2.0
// GET  /mcp → SSE events
```

## Development

```bash
npm install
npm run build
npm pack --dry-run
```

## License

MIT