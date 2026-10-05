# Keepalive — Claude Desktop (MCP)

- The MCP server owns transport. Do not implement your own heartbeats.
- Poll `orchestrator/comms/loop-state.json` at most every 60s.
- On disconnect, wait for the server's next handshake before writing.
