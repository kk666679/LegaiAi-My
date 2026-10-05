# mcp/

Model Context Protocol server (`2024-11-05`).

## Layout
| File | Purpose |
|---|---|
| `index.js` | barrel + `createServer` / `serveStdio` / `serveHttp` |
| `server.js` | `McpServer` — JSON-RPC dispatch + lifecycle |
| `protocol.js` | JSON-RPC 2.0 constants + response builders |
| `capabilities.js` | `initialize.capabilities` computation |
| `resources.js` | `ResourceRegistry` — `autoclaw://…` URIs |
| `prompts.js` | `PromptRegistry` — 5 default prompts |
| `tools/` | one file per tool domain (see below) |
| `transport/stdio.js` | newline-delimited JSON over stdin/stdout |
| `transport/http.js` | Streamable HTTP: POST + GET/SSE |

## Tools (`mcp/tools/`)

| File | Tools |
|---|---|
| `registry-introspect.js` | `registry_snapshot`, `registry_integrity` |
| `agents.js` | `agents_list`, `agents_show`, `agents_invoke`, `agents_route` |
| `skills.js` | `skills_list`, `skills_show`, `skills_validate`, `skills_golden` |
| `kg.js` | `kg_get_node`, `kg_search`, `kg_traverse`, `kg_stats`, `kg_upsert` |
| `kdream.js` | `kdream_run`, `kdream_read_memory`, `kdream_list_insights` |
| `kgdream.js` | `kgdream_run` |
| `hitl.js` | `hitl_queue_list`, `hitl_queue_stats`, `hitl_resolve`, `hitl_policy_evaluate` |
| `consensus.js` | `consensus_vote`, `consensus_strategies` |
| `tasks.js` | `task_enqueue`, `task_get`, `task_list` |
| `cache.js` | `cache_stats`, `cache_clear` |
| `export.js` | `export_format`, `export_render_all` |
| `i18n.js` | `i18n_detect`, `i18n_translate` |
| `dataset.js` | `dataset_list`, `dataset_validate`, `dataset_show` |
| `observability.js` | `metrics_render`, `metrics_snapshot` |

**37 tools** total. Adding one is a one-line file + one-line registration in `tools/index.js`.

## Resources (`autoclaw://…`)
`health`, `registry`, `registry/agents`, `registry/models`, `registry/skills`,
`agents`, `skills`, `dataset`, `kdream/memory`, `cache/stats`, `metrics`,
plus templates `kg/node/{id}` and `skills/{name}`.

## Prompts
`irac_analysis`, `legal_memo`, `citation_check`, `bilingual_summary`, `agent_plan`.

## Usage

### stdio
```js
const { serveStdio } = require('./mcp');
const { stop } = serveStdio({});   // pulls deps from siblings by default
```

### HTTP
```js
const { serveHttp } = require('./mcp');
const { handler } = serveHttp({});
require('http').createServer(handler).listen(7331);
// POST /mcp  → JSON-RPC
// GET  /mcp  → SSE
```

### Direct (testable without transport)
```js
const { createServer } = require('./mcp');
const server = createServer();
const r = await server.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
```

## Methods
`initialize`, `notifications/initialized`, `ping`,
`tools/list`, `tools/call`,
`resources/list`, `resources/read`,
`prompts/list`, `prompts/get`,
`logging/setLevel`, `shutdown`.
