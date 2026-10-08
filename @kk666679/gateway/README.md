# LAWMATE AI API GATEWAY

Unified AI Infrastructure for LAWMATE.

## Installation

```bash
npm install @kk666679/gateway
```

## Quick Start

```bash
# Start the LAWMATE AI API GATEWAY server
node server.js

# With development mode (watching for changes)
npm run dev

# Health check
node -e "import('./server.js').then(m => console.log('Gateway operational'))"
```

## Server Startup

When the Gateway starts, it displays the LAWMATE FIGlet branding:

```
██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                  MCP • CLI • AI API GATEWAY

LAWMATE AI API GATEWAY
Unified AI Infrastructure

Environment: development
API: ready
Database: connected
Queue: connected
Providers: ready
```

### Startup Status Checks

The gateway automatically checks and reports:

| Status | Description |
|--------|-------------|
| `Environment` | `development` or `production` based on NODE_ENV |
| `API` | Whether the Express server is listening |
| `Database` | PostgreSQL connectivity (when backend is available) |
| `Queue` | Redis connectivity via BullMQ |
| `Providers` | LLM provider availability (Ollama, OpenAI, etc.) |

## API Endpoints

The gateway provides the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Overall service health |
| `/health/db` | GET | Database connectivity check |
| `/health/ollama` | GET | Ollama model availability |
| `/health/queue` | GET | Queue (BullMQ) status |
| `/metrics` | GET | Prometheus metrics |
| `/api/ai-chat` | POST | AI chat with SSE streaming |

## Environment Configuration

Required environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `POSTGRES_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `OLLAMA_URL` | Ollama API URL | `http://localhost:11434` |
| `LLM_MODEL` | Default LLM model | `llama3.1` |

## Development

```bash
npm install
npm run build
npm run dev
npm start
```

## Health Monitoring

The gateway provides comprehensive health checks:

```bash
# Check all health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/db
curl http://localhost:3001/health/ollama
curl http://localhost:3001/health/queue

# Check metrics
curl http://localhost:3001/metrics
```

## Security

- Input validation on all endpoints
- Rate limiting on sensitive routes
- Helmet security headers
- CORS configuration for controlled origins
- Authentication middleware for protected routes

## License

MIT