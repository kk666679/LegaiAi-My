# Keepalive — OpenAI Codex

- Treat each completion as one turn. Do not chain turns.
- After code edits, run `npm run check` before emitting DONE.
- If `npm run check` fails, do not patch — revert and report.
